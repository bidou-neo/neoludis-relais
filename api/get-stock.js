// api/get-stock.js
// Interroge la base Sage (SQL Server OVH) pour récupérer le stock par éditeur

const sql = require('mssql');

const config = {
  server:   process.env.SAGE_SERVER,   // ex: ns3201072.ip-xx-xx-xx.eu
  port:     parseInt(process.env.SAGE_PORT || '1433'),
  database: process.env.SAGE_DATABASE || 'NEOLUDIS',
  user:     process.env.SAGE_USER,
  password: process.env.SAGE_PASSWORD,
  options: {
    encrypt: false,           // pas de TLS forcé sur SQL Server local OVH
    trustServerCertificate: true,
    connectTimeout: 10000,
    requestTimeout: 15000,
  },
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { editeur, depot } = req.query;

  // depot : 'neoludis' (DE_No=1), 'editeur' (DE_No=4), 'all' (les deux)
  // Par défaut on affiche les deux
  let depotsFilter = 'IN (1, 4)';
  if (depot === 'neoludis') depotsFilter = '= 1';
  if (depot === 'editeur')  depotsFilter = '= 4';

  if (!editeur) {
    return res.status(400).json({ error: 'Paramètre editeur requis' });
  }

  let pool;
  try {
    pool = await sql.connect(config);

    const result = await pool.request()
      .input('editeur', sql.VarChar, editeur)
      .query(`
        SELECT
          a.AR_Ref                              AS ref_neoludis,
          a.AR_Design                           AS designation,
          a.AR_CodeBarre                        AS ean,
          a.[Editeur]                           AS editeur,
          f.CT_Num                              AS code_fournisseur,
          f.AF_RefFourniss                      AS ref_editeur,
          s.DE_No                               AS depot,
          d.DE_Intitule                         AS depot_nom,
          s.AS_QteSto                           AS qte_stock,
          s.AS_QteRes                           AS qte_reservee,
          s.AS_QteSto - s.AS_QteRes             AS qte_disponible
        FROM F_ARTICLE a
        JOIN F_ARTSTOCK s
          ON a.AR_Ref = s.AR_Ref
        JOIN F_DEPOT d
          ON s.DE_No = d.DE_No
        LEFT JOIN F_ARTFOURNISS f
          ON a.AR_Ref = f.AR_Ref AND f.AF_Principal = 1
        WHERE s.DE_No ${depotsFilter}
          AND LOWER(a.[Editeur]) = LOWER(@editeur)
          AND a.AR_Sommeil = 0
        ORDER BY a.AR_Ref, s.DE_No
      `);

    // Regrouper par ref_neoludis pour avoir les deux dépôts sur une ligne
    const grouped = {};
    result.recordset.forEach(row => {
      if (!grouped[row.ref_neoludis]) {
        grouped[row.ref_neoludis] = {
          ref_neoludis:    row.ref_neoludis,
          designation:     row.designation,
          ean:             row.ean,
          editeur:         row.editeur,
          ref_editeur:     row.ref_editeur || '',
          code_fournisseur: row.code_fournisseur || '',
          stock_neoludis:  0,
          stock_editeur:   0,
          reserve_neoludis: 0,
          reserve_editeur:  0,
          dispo_neoludis:  0,
          dispo_editeur:   0,
        };
      }
      if (row.depot === 1) {
        grouped[row.ref_neoludis].stock_neoludis   = parseFloat(row.qte_stock) || 0;
        grouped[row.ref_neoludis].reserve_neoludis = parseFloat(row.qte_reservee) || 0;
        grouped[row.ref_neoludis].dispo_neoludis   = parseFloat(row.qte_disponible) || 0;
      }
      if (row.depot === 4) {
        grouped[row.ref_neoludis].stock_editeur   = parseFloat(row.qte_stock) || 0;
        grouped[row.ref_neoludis].reserve_editeur = parseFloat(row.qte_reservee) || 0;
        grouped[row.ref_neoludis].dispo_editeur   = parseFloat(row.qte_disponible) || 0;
      }
    });

    const articles = Object.values(grouped);

    // Stats globales
    const stats = {
      total_refs:        articles.length,
      total_stock_neo:   articles.reduce((s, a) => s + a.stock_neoludis, 0),
      total_stock_edit:  articles.reduce((s, a) => s + a.stock_editeur, 0),
      refs_en_stock:     articles.filter(a => a.dispo_neoludis > 0 || a.dispo_editeur > 0).length,
      refs_rupture:      articles.filter(a => a.dispo_neoludis === 0 && a.dispo_editeur === 0).length,
    };

    res.json({ success: true, editeur, articles, stats });

  } catch (err) {
    console.error('Sage SQL error:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (pool) await pool.close();
  }
};
