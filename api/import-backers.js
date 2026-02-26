// api/import-backers.js
// Reçoit un tableau de backers et les stocke dans l'onglet "Backers" du Sheet
// POST { editeur, backers: [{ref, email, prenom, nom, telephone}] }

import { getAccessToken } from './_google-auth.js';

const SHEET_ID  = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = 'Backers'; // Nom de l'onglet dans le Sheet

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Méthode non autorisée' });

  const { editeur, backers } = req.body;
  if (!editeur || !backers?.length) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    const token = await getAccessToken();

    // 1. Récupérer les refs déjà présentes pour cet éditeur (éviter les doublons)
    const existing = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_TAB}!A:C`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(r => r.json());

    const existingRefs = new Set(
      (existing.values || []).slice(1)
        .filter(row => (row[0]||'').toLowerCase() === editeur.toLowerCase())
        .map(row => String(row[1]||'').toLowerCase())
    );

    // 2. Filtrer les nouveaux backers uniquement
    const nouveaux = backers.filter(b => !existingRefs.has(String(b.ref||'').toLowerCase()));

    if (!nouveaux.length) {
      return res.status(200).json({ success: true, importes: 0, message: 'Tous les backers existaient déjà' });
    }

    // 3. Préparer les lignes
    // Colonnes : Éditeur | Ref | Email | Prénom | Nom | Téléphone
    const rows = nouveaux.map(b => [
      editeur,
      String(b.ref    || ''),
      String(b.email  || ''),
      String(b.prenom || ''),
      String(b.nom    || ''),
      b.telephone ? `'${b.telephone}` : '',  // ' pour forcer texte
    ]);

    // 4. Append dans l'onglet Backers
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_TAB}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows }),
      }
    );
    const appendData = await appendRes.json();
    if (appendData.error) throw new Error(JSON.stringify(appendData.error));

    return res.status(200).json({ success: true, importes: nouveaux.length, ignores: backers.length - nouveaux.length });

  } catch (err) {
    console.error('import-backers error:', err);
    return res.status(500).json({ error: err.message });
  }
}
