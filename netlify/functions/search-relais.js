exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const { cp } = event.queryStringParameters || {};

  if (!cp) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Paramètre cp requis' }) };
  }

  try {
    // API v2.1 avec le bon nom de dataset et le bon filtre
    const url = `https://datanova.laposte.fr/api/explore/v2.1/catalog/datasets/laposte-poincont2/records?where=code_postal_du_site%3D%22${encodeURIComponent(cp)}%22&limit=50`;
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    const text = await res.text();
    console.log('dataNOVA status:', res.status);
    console.log('dataNOVA response (first 500):', text.substring(0, 500));
    
    let data;
    try { data = JSON.parse(text); } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Parse error', raw: text.substring(0, 200) }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
