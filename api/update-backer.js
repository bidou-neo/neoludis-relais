// api/update-backer.js
// Met à jour la colonne email_envoyé pour un ou plusieurs backers
// POST { editeur, refs: ['1370971', ...], email_envoye: true }

import { getAccessToken } from './_google-auth.js';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { editeur, refs } = req.body;
  if (!editeur || !refs?.length) return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    const token = await getAccessToken();
    const editeurN = editeur.toLowerCase();
    const refsSet = new Set(refs.map(r => String(r).toLowerCase()));

    // Lire toutes les lignes de Backers pour trouver les numéros de lignes
    const r = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Backers!A:G`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await r.json();
    const rows = data.values || [];

    // Préparer les mises à jour batch
    const updates = [];
    rows.forEach((row, idx) => {
      if (idx === 0) return; // skip header
      if ((row[0]||'').toLowerCase() === editeurN && refsSet.has(String(row[1]||'').toLowerCase())) {
        const rowNum = idx + 1; // 1-indexed pour Sheets
        updates.push({
          range: `Backers!G${rowNum}`,
          values: [['Oui']],
        });
      }
    });

    if (!updates.length) return res.status(200).json({ success: true, updated: 0 });

    // Batch update
    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ valueInputOption: 'RAW', data: updates }),
      }
    );
    const batchData = await batchRes.json();
    if (batchData.error) throw new Error(JSON.stringify(batchData.error));

    return res.status(200).json({ success: true, updated: updates.length });

  } catch (err) {
    console.error('update-backer error:', err);
    return res.status(500).json({ error: err.message });
  }
}
