// api/update-status.js
// POST { editeur, refs: [...], statut: 'En cours' | 'Expédié' | 'Livré' }
// Met à jour la colonne H (Statut) dans l'onglet Backers

import { getAccessToken } from './_google-auth.js';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { editeur, refs, statut } = req.body;
  if (!refs?.length || !statut) return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets');

    // Lire toutes les lignes pour trouver les positions des refs
    const readRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Backers!A:H`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const readData = await readRes.json();
    const rows = readData.values || [];

    // Construire les mises à jour batch
    const updates = [];
    rows.forEach((row, i) => {
      if (i === 0) return; // skip header
      const rowEditeur = (row[0] || '').toLowerCase();
      const rowRef     = String(row[1] || '').toLowerCase();
      if (
        (!editeur || rowEditeur === editeur.toLowerCase()) &&
        refs.map(r => String(r).toLowerCase()).includes(rowRef)
      ) {
        updates.push({
          range: `Backers!H${i + 1}`,
          values: [[statut]],
        });
      }
    });

    if (!updates.length) return res.status(200).json({ success: true, mis_a_jour: 0 });

    // Batch update
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: updates,
        }),
      }
    );

    const updateData = await updateRes.json();
    return res.status(200).json({ success: true, mis_a_jour: updates.length });

  } catch (err) {
    console.error('update-status error:', err);
    return res.status(500).json({ error: err.message });
  }
}
