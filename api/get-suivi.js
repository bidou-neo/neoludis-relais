// api/get-suivi.js
// Retourne la liste des backers avec statut email_envoyé, a_répondu, numéro de colis
// GET ?editeur=dendrobat

import { getAccessToken } from './_google-auth.js';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { editeur } = req.query;
  if (!editeur) return res.status(400).json({ error: 'Paramètre editeur manquant' });

  try {
    const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets.readonly');
    const editeurN = editeur.toLowerCase();

    // 1. Backers — colonnes A:I (I = NumeroColis)
    const backersRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Backers!A:I`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const backersData = await backersRes.json();
    const backersRows = (backersData.values || []).slice(1)
      .filter(r => (r[0]||'').toLowerCase() === editeurN);

    // 2. Réponses
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

    // 3. Croiser
    const backers = backersRows.map(r => ({
      ref:           r[1] || '',
      email:         r[2] || '',
      prenom:        r[3] || '',
      nom:           r[4] || '',
      email_envoye:  (r[6]||'').toLowerCase() === 'oui',
      a_repondu:     refsRepondus.has(String(r[1]||'').toLowerCase()),
      statut:        r[7] || '',
      numero_colis:  r[8] || '',
    }));

    return res.status(200).json({ success: true, backers });

  } catch (err) {
    console.error('get-suivi error:', err);
    return res.status(500).json({ error: err.message });
  }
}
