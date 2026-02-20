exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // D'abord récupérer les champs disponibles dans le dataset
    const schemaRes = await fetch('https://datanova.laposte.fr/data-fair/api/v1/datasets/laposte-poincont2', {
      headers: { 'Accept': 'application/json' }
    });
    const schemaText = await schemaRes.text();
    
    // Et aussi récupérer une ligne sans filtre pour voir la structure
    const sampleRes = await fetch('https://datanova.laposte.fr/data-fair/api/v1/datasets/laposte-poincont2/lines?size=1', {
      headers: { 'Accept': 'application/json' }
    });
    const sampleText = await sampleRes.text();

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        schema_status: schemaRes.status,
        schema: schemaText.substring(0, 1000),
        sample_status: sampleRes.status,
        sample: sampleText.substring(0, 1000)
      }, null, 2) 
    };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
