// api/get-suivi.js
// GET ?editeur=dendrobat           → liste tous les backers d'un éditeur (suivi)
// GET ?editeur=dendrobat&ref=XXXX  → récupère un seul backer (ex-get-backer.js)

import { getAccessToken } from './_google-auth.js';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { editeur, ref } = req.query;
  if (!editeur) return res.status(400).json({ error: 'Paramètre editeur manquant' });

  try {
    const token    = await getAccessToken('https://www.googleapis.com/auth/spreadsheets.readonly');
    const editeurN = editeur.toLowerCase();

    // ── Mode : récupérer un seul backer (ex-get-backer.js) ──────────
    if (ref) {
      const r    = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Backers!A:F`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await r.json();
      const rows = (data.values || []).slice(1);
      const refN = String(ref).toLowerCase();
      const row  = rows.find(r =>
        (r[0]||'').toLowerCase() === editeurN &&
        String(r[1]||'').toLowerCase() === refN
      );
      if (!row) return res.status(200).json({ trouve: false });
      return res.status(200).json({
        trouve:    true,
        ref:       row[1] || '',
        email:     row[2] || '',
        prenom:    row[3] || '',
        nom:       row[4] || '',
        telephone: row[5] || '',
      });
    }

    // ── Mode : liste complète pour suivi ─────────────────────────────
    const backersRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Backers!A:I`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const backersData = await backersRes.json();
    const backersRows = (backersData.values || []).slice(1)
      .filter(r => (r[0]||'').toLowerCase() === editeurN);

    const reponsesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Feuille%201!A:C`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const reponsesData = await reponsesRes.json();
    const refsRepondus = new Set(
      (reponsesData.values || []).slice(1)
        .filter(r => (r[1]||'').toLowerCase() === editeurN)
        .map(r => String(r[2]||'').toLowerCase())
    );

    const backers = backersRows.map(r => ({
      ref:          r[1] || '',
      email:        r[2] || '',
      prenom:       r[3] || '',
      nom:          r[4] || '',
      email_envoye: (r[6]||'').toLowerCase() === 'oui',
      a_repondu:    refsRepondus.has(String(r[1]||'').toLowerCase()),
      statut:       r[7] || '',
      numero_colis: r[8] || '',
    }));

    return res.status(200).json({ success: true, backers });

  } catch (err) {
    console.error('get-suivi error:', err);
    return res.status(500).json({ error: err.message });
  }
}
