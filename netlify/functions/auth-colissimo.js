

// Fonction Netlify — Authentification Colissimo
// Le mot de passe est stocké dans les variables d'environnement Netlify (jamais visible dans le code)

exports.handler = async function(event, context) {
  // Autoriser les requêtes CORS depuis notre propre site
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Répondre aux requêtes OPTIONS (preflight CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  // Récupérer les variables d'environnement (stockées de façon sécurisée dans Netlify)
  const accountNumber = process.env.COLISSIMO_ACCOUNT;
  const password = process.env.COLISSIMO_PASSWORD;

  if (!accountNumber || !password) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Variables d\'environnement manquantes. Configurez COLISSIMO_ACCOUNT et COLISSIMO_PASSWORD dans Netlify.' })
    };
  }

  try {
    // Appel au WS d'authentification Colissimo
    const response = await fetch('https://ws.colissimo.fr/widget-point-retrait/rest/authenticate.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: accountNumber,
        password: password,
      }),
    });

    const data = await response.json();

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
        body: JSON.stringify({ error: 'Authentification échouée', details: data }),
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
