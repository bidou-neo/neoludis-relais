// api/reconcile-colis.js
// Appelé automatiquement par chargerSuivi() si des backers n'ont pas de numéro de colis
// Relit l'onglet "Colis" et tente le matching avec l'onglet "Backers"

import { getAccessToken } from './_google-auth.js';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function sheetsRead(token, range) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sheets read: ${data.error.message}`);
  return data.values || [];
}

async function sheetsUpdate(token, updates) {
  if (!updates.length) return;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ valueInputOption: 'USER_ENTERED', data: updates }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sheets update: ${data.error.message}`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets');

    // Lire l'onglet Colis → map ref_lower → numero
    const colis = await sheetsRead(token, 'Colis!A:B');
    const colisMap = new Map();
    colis.forEach((row, i) => {
      if (i === 0) return;
      if (row[0] && row[1]) colisMap.set(String(row[0]).toLowerCase(), row[1]);
    });

    if (!colisMap.size) {
      return res.status(200).json({ success: true, mis_a_jour: 0 });
    }

    // Lire les backers — uniquement ceux sans numéro de colis (colonne I vide)
    const backers = await sheetsRead(token, 'Backers!A:I');
    const updates = [];
    backers.forEach((row, i) => {
      if (i === 0) return;
      const ref      = String(row[1] || '').toLowerCase();
      const dejaColis = row[8] && row[8].trim();
      if (!dejaColis && colisMap.has(ref)) {
        updates.push({ range: `Backers!I${i + 1}`, values: [[colisMap.get(ref)]] });
        updates.push({ range: `Backers!H${i + 1}`, values: [['Expédié']] });
      }
    });

    await sheetsUpdate(token, updates);
    const mis_a_jour = updates.length / 2;

    return res.status(200).json({ success: true, mis_a_jour });

  } catch (err) {
    console.error('[reconcile-colis]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
