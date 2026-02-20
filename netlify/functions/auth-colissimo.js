// Fonction Netlify — Authentification Colissimo
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  const accountNumber = process.env.COLISSIMO_ACCOUNT;
  const password = process.env.COLISSIMO_PASSWORD;

  if (!accountNumber || !password) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Variables d\'environnement manquantes.' })
    };
  }

  try {
    const response = await fetch('https://ws.colissimo.fr/widget-point-retrait/rest/authenticate.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: accountNumber,
        password: password,
        lang: 'FR',
      }),
    });

    // Lire la réponse brute pour diagnostiquer
    const rawText = await response.text();
    console.log('Status Colissimo:', response.status);
    console.log('Réponse Colissimo brute:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch(e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Réponse non-JSON de Colissimo', raw: rawText, status: response.status }),
      };
    }

    if (data.token) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ token: data.token }),
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentification échouée', details: data, status: response.status }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur', details: err.message }),
    };
  }
};
