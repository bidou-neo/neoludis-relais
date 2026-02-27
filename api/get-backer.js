// api/get-backer.js
// Récupère les infos d'un backer depuis l'onglet "Backers" du Sheet
// GET ?editeur=dendrobat&ref=1370971

import { getAccessToken } from './_google-auth.js';

const SHEET_ID  = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = 'Backers';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { editeur, ref } = req.query;
  if (!editeur || !ref) return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets.readonly');

    const r    = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_TAB}!A:F`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await r.json();
    const rows = (data.values || []).slice(1); // Ignorer l'en-tête

    // Colonnes : A=Éditeur | B=Ref | C=Email | D=Prénom | E=Nom | F=Téléphone
    const editeurN = editeur.toLowerCase();
    const refN     = String(ref).toLowerCase();

    const row = rows.find(r =>
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

  } catch (err) {
    console.error('get-backer error:', err);
    return res.status(200).json({ trouve: false }); // Non bloquant
  }
}
