export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const accountNumber = process.env.COLISSIMO_ACCOUNT;
  const password = process.env.COLISSIMO_PASSWORD;

  if (!accountNumber || !password) {
    return res.status(500).json({ error: 'Variables d\'environnement manquantes.' });
  }

  try {
    const response = await fetch('https://ws.colissimo.fr/widget-colissimo/rest/authenticate.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: accountNumber, password: password }),
    });

    const data = await response.json();

    if (data.token) {
      return res.status(200).json({ token: data.token });
    }

    return res.status(401).json({ error: 'Authentification échouée', details: data });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
}
