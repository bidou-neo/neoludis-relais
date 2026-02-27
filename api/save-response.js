export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } = process.env;

  try {
    const body = req.body;

    // Créer le JWT pour l'authentification Google
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const signingInput = `${b64(header)}.${b64(payload)}`;

    // Signer avec la clé privée
    const { createSign } = await import('crypto');
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const signature = sign.sign(privateKey, 'base64url');
    const jwt = `${signingInput}.${signature}`;

    // Obtenir le token d'accès
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Auth Google échouée', details: tokenData });
    }

    // Écrire dans le Google Sheet
    // Préfixe ' sur les champs numériques pour forcer le format texte dans Sheets
    const tel = body.telephone ? `'${body.telephone}` : '';
    const cp  = body.relay_codepostal ? `'${body.relay_codepostal}` : '';
    const row = [
      body.date || new Date().toLocaleString('fr-FR'),
      body.editeur || '',
      body.commande || '',
      body.prenom || '',
      body.nom || '',
      body.email || '',
      tel,
      body.relay_id || '',
      body.relay_nom || '',
      body.relay_adresse || '',
      body.relay_adresse2 || '',
      cp,
      body.relay_ville || '',
      body.relay_pays || 'France',
      body.relay_pays_code || 'FR',
      body.relay_type || '',
    ];

    const sheetsRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    const sheetsData = await sheetsRes.json();
    if (sheetsData.error) {
      return res.status(500).json({ error: 'Sheets échoué', details: sheetsData.error });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
