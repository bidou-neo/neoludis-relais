// api/export-dropbox.js
// POST { editeur, rows: [...] }
// Dépose le CSV dans le dossier Dropbox et retourne le lien de téléchargement

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
  if (!DROPBOX_TOKEN) return res.status(500).json({ error: 'DROPBOX_TOKEN manquant' });

  const { editeur, rows } = req.body;
  if (!rows || !rows.length) return res.status(400).json({ error: 'Aucune donnée à exporter' });

  try {
    // ── Générer le CSV ──────────────────────────────────────────────
    const esc = v => '"' + String(v || '').replace(/"/g, '""') + '"';
    const editeurLabel = editeur || 'Neoludis';
    const date = new Date().toISOString().split('T')[0];

    let csv = '\uFEFF';
    csv += `${editeurLabel};;;;;;;;;;;;;;;;\n`;
    csv += `;;;;;;;;;;;;;;;;Ref Article;\n`;
    csv += `;;;;;;;;;;;;;;;;Libellé Article;\n`;
    csv += `;;;;;;;;;;;;;;;;Editeur;${editeurLabel}\n`;
    csv += `;;;;;;;;;;;;;;;;PU TTC;\n`;
    csv += `;;;;;;;;;;;;;;;;Taux TVA;\n`;
    csv += `;;;;;;;;;;;;;;;;Poids;\n`;
    csv += ['Ref Commande','Email','Société','Nom','Prénom','Adresse 1','Adresse 2','Adresse 3',
            'Code Postal','Ville','Pays','Code Pays','Etat','Code point retrait',
            'Téléphone','Mobile','Instruction Livreur'].map(esc).join(';') + '\n';

    rows.forEach(row => {
      const isRelais = row.mode_livraison === 'relais';
      const tel = row.telephone || '';
      const isMobile = /^(06|07|\+336|\+337)/.test(tel.replace(/\s/g, ''));
      const line = [
        row.commande         || '',
        row.email            || '',
        '',
        row.nom              || '',
        row.prenom           || '',
        row.relay_adresse    || '',
        isRelais ? '' : (row.relay_adresse2 || ''),
        '',
        row.relay_codepostal || '',
        row.relay_ville      || '',
        isRelais ? 'France' : (row.relay_pays      || 'France'),
        isRelais ? 'FR'     : (row.relay_pays_code || 'FR'),
        '',
        isRelais ? (row.relay_id || '') : '',
        isMobile ? '' : tel,
        isMobile ? tel : '',
        '',
      ];
      csv += line.map(esc).join(';') + '\n';
    });

    // ── Déposer sur Dropbox ─────────────────────────────────────────
    const filename = `Demandes_Envois_${editeurLabel}_${date}.csv`;
    const dropboxPath = `/Preparation de commandes/BtoC/Script/import CSV app/${filename}`;

    const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'overwrite',
          autorename: false,
          mute: false,
        }),
      },
      body: Buffer.from(csv, 'utf-8'),
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: 'Erreur upload Dropbox', detail: err });
    }

    const uploadData = await uploadRes.json();

    // ── Lien de partage ─────────────────────────────────────────────
    let shareLink = '';
    const shareRes = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: dropboxPath, settings: { requested_visibility: 'public' } }),
    });

    if (shareRes.ok) {
      const shareData = await shareRes.json();
      shareLink = shareData.url?.replace('?dl=0', '?dl=1') || '';
    } else {
      // Lien déjà existant → le récupérer
      const existRes = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${DROPBOX_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dropboxPath }),
      });
      if (existRes.ok) {
        const existData = await existRes.json();
        shareLink = existData.links?.[0]?.url?.replace('?dl=0', '?dl=1') || '';
      }
    }

    return res.status(200).json({ success: true, filename, path: uploadData.path_display, lien: shareLink, nb: rows.length });

  } catch (err) {
    console.error('export-dropbox error:', err);
    return res.status(500).json({ error: err.message });
  }
}
