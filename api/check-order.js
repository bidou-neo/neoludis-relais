// api/check-order.js
// GET ?editeur=X&commande=Y         → vérifie si commande déjà enregistrée
// POST ?mode=password { editeur, password } → vérifie le mot de passe admin

import { getAccessToken } from './_google-auth.js';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function normalize(s) {
  return (s || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── Mode vérification mot de passe ──────────────────────────
  if (req.method === 'POST' && req.query?.mode === 'password') {
    const { editeur, password } = req.body || {};
    if (!password) return res.status(400).json({ ok: false, error: 'Paramètres manquants' });

    try {
      const raw      = process.env.ADMIN_PASSWORDS || '{}';
      const passwords = JSON.parse(raw);
      // editeur vide = admin global
      const key      = editeur || '';
      const expected = passwords[key];
      if (!expected) return res.status(200).json({ ok: false, error: 'Éditeur inconnu' });
      return res.status(200).json({ ok: password === expected });
    } catch(e) {
      return res.status(500).json({ ok: false, error: 'Config mots de passe invalide' });
    }
  }

  // ── Mode vérification commande existante ─────────────────────
  const { editeur, commande } = req.query;
  if (!editeur || !commande) return res.status(400).json({ erreur: 'Paramètres manquants' });

  try {
    const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets.readonly');
    const r     = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:C`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data  = await r.json();
    const rows  = data.values || [];

    const editeurN  = normalize(editeur);
    const commandeN = normalize(commande);
    const existe    = rows.slice(1).some(row =>
      normalize(row[1]) === editeurN && normalize(row[2]) === commandeN
    );

    return res.status(200).json({ existe });

  } catch (err) {
    console.error('check-order error:', err);
    return res.status(200).json({ existe: false });
  }
}
