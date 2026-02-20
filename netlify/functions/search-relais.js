exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const { cp } = event.queryStringParameters || {};
  if (!cp) return { statusCode: 400, headers, body: JSON.stringify({ error: 'cp requis' }) };

  // Tester plusieurs endpoints possibles
  const endpoints = [
    `https://datanova.laposte.fr/api/explore/v2.1/catalog/datasets/laposte-poincont2/records?where=code_postal_du_site="${cp}"&limit=10`,
    `https://datanova.laposte.fr/api/explore/v2.1/catalog/datasets/laposte_poincont2/records?where=code_postal_du_site="${cp}"&limit=10`,
    `https://datanova.laposte.fr/data-fair/api/v1/datasets/laposte-poincont2/lines?size=10&qs=code_postal_du_site:${cp}`,
    `https://datanova.laposte.fr/data-fair/api/v1/datasets/laposte-poincont/lines?size=10&qs=code_postal_du_site:${cp}`,
  ];

  const results = {};
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const text = await res.text();
      results[url] = { status: res.status, body: text.substring(0, 200) };
    } catch(e) {
      results[url] = { error: e.message };
    }
  }

  return { statusCode: 200, headers, body: JSON.stringify(results, null, 2) };
};
