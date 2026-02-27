// api/export-dropbox.js
// Dépose le CSV des réponses sur Dropbox
// POST { editeur, csv (contenu string), filename }

const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const DROPBOX_FOLDER = '/Neoludis/Exports';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { editeur, csv, filename } = req.body;
  if (!csv) return res.status(400).json({ error: 'Contenu CSV manquant' });

  const filePath = `${DROPBOX_FOLDER}/${filename || `Export_${editeur}_${new Date().toISOString().split('T')[0]}.csv`}`;

  try {
    const r = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DROPBOX_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: filePath,
          mode: 'overwrite',
          autorename: false,
          mute: false,
        }),
        'Content-Type': 'application/octet-stream',
      },
      body: csv,
    });

    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data.error_summary || 'Erreur Dropbox' });

    return res.status(200).json({
      success: true,
      path: data.path_display,
      size: data.size,
    });
  } catch (err) {
    console.error('export-dropbox error:', err);
    return res.status(500).json({ error: err.message });
  }
}
