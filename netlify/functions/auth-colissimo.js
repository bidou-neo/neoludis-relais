exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };

  const accountNumber = process.env.COLISSIMO_ACCOUNT;
  const password = process.env.COLISSIMO_PASSWORD;

  if (!accountNumber || !password) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Variables d\'environnement manquantes.' }) };
  }

  try {
    // Essayer les deux endpoints (widget v2 et widget-point-retrait)
    const endpoints = [
      'https://ws.colissimo.fr/widget-colissimo/rest/authenticate.rest',
      'https://ws.colissimo.fr/widget-point-retrait/rest/authenticate.rest',
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: accountNumber, password: password }),
      });

      const rawText = await response.text();
      console.log(`Endpoint: ${endpoint}`);
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${rawText}`);

      let data;
      try { data = JSON.parse(rawText); } catch(e) { continue; }

      if (data.token) {
        return { statusCode: 200, headers, body: JSON.stringify({ token: data.token, endpoint }) };
      }
    }

    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentification échouée sur tous les endpoints' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur serveur', details: err.message }) };
  }
};
