exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const { cp, ville } = event.queryStringParameters || {};

  if (!cp && !ville) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Paramètre cp ou ville requis' }) };
  }

  try {
    let url;
    if (cp) {
      url = `https://datanova.laposte.fr/api/records/1.0/search/?dataset=laposte-poincont2&rows=50&refine.code_postal_du_site=${encodeURIComponent(cp)}`;
    } else {
      url = `https://datanova.laposte.fr/api/records/1.0/search/?dataset=laposte-poincont2&rows=50&q=${encodeURIComponent(ville)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
