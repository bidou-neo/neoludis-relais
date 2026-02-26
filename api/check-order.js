// api/check-order.js
// Vérifie si une commande a déjà été enregistrée pour un éditeur donné

import { createSign } from 'crypto';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function b64url(str) {
  return Buffer.from(str).toString('base64url');
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const now   = Math.floor(Date.now() / 1000);

  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(key, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

function normalize(s) {
  return (s || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { editeur, commande } = req.query;

  if (!editeur || !commande) {
    return res.status(400).json({ erreur: 'Paramètres manquants' });
  }

  try {
    const token = await getAccessToken();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:C`;
    const r   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    const rows = data.values || [];

    // Colonnes du Sheet : A=Date, B=Éditeur, C=N° Commande
    const editeurN  = normalize(editeur);
    const commandeN = normalize(commande);

    const existe = rows.slice(1).some(row => {
      const rowEditeur   = normalize(row[1] || '');
      const rowCommande  = normalize(row[2] || '');
      return rowEditeur === editeurN && rowCommande === commandeN;
    });

    return res.status(200).json({ existe });

  } catch (err) {
    console.error('check-order error:', err);
    // En cas d'erreur, on laisse passer (non bloquant)
    return res.status(200).json({ existe: false });
  }
}
