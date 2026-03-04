// api/update-status.js
// POST { editeur, refs, statut }              → met à jour col H dans Backers
// POST ?mode=commande { editeur, ref, statut } → met à jour col P dans Commandes

import { getAccessToken } from '../api/_google-auth.js';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets');

  // ── Mode : statut commande ───────────────────────────────────
  if (req.query?.mode === 'commande') {
    const { editeur, ref, statut } = req.body;
    if (!ref || !statut) return res.status(400).json({ error: 'Paramètres manquants' });

    const r    = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('Commandes!A:P')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await r.json();
    const rows = data.values || [];

    const updates = [];
    rows.forEach((row, i) => {
      if (i === 0) return;
      const rowRef     = String(row[3] || '').toLowerCase();
      const rowEditeur = String(row[1] || '').toLowerCase();
      if (rowRef === ref.toLowerCase() && (!editeur || rowEditeur === editeur.toLowerCase())) {
        updates.push({ range: `Commandes!P${i + 1}`, values: [[statut]] });
      }
    });

    if (!updates.length) return res.status(200).json({ success: true, mis_a_jour: 0 });

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ valueInputOption: 'USER_ENTERED', data: updates }),
      }
    );
    return res.status(200).json({ success: true, mis_a_jour: updates.length });
  }

  // ── Mode : statut backer (comportement original) ─────────────
  const { editeur, refs, statut } = req.body;
  if (!refs?.length || !statut) return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    const readRes  = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Backers!A:H`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const readData = await readRes.json();
    const rows     = readData.values || [];

    const updates = [];
    rows.forEach((row, i) => {
      if (i === 0) return;
      const rowEditeur = (row[0] || '').toLowerCase();
      const rowRef     = String(row[1] || '').toLowerCase();
      if (
        (!editeur || rowEditeur === editeur.toLowerCase()) &&
        refs.map(r => String(r).toLowerCase()).includes(rowRef)
      ) {
        updates.push({ range: `Backers!H${i + 1}`, values: [[statut]] });
      }
    });

    if (!updates.length) return res.status(200).json({ success: true, mis_a_jour: 0 });

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ valueInputOption: 'USER_ENTERED', data: updates }),
      }
    );
    return res.status(200).json({ success: true, mis_a_jour: updates.length });

  } catch (err) {
    console.error('update-status error:', err);
    return res.status(500).json({ error: err.message });
  }
}
