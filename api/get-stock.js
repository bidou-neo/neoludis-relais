// api/get-stock.js
// Lit stock_site.xlsx depuis Dropbox
// Utilise le refresh token OAuth2 pour ne jamais expirer

const https = require('https');

const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
const DROPBOX_APP_KEY       = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET    = process.env.DROPBOX_APP_SECRET;
const DROPBOX_PATH          = '/Neoludis/Preparation de commandes/Sources_BL/stock_site.xlsx';

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const body = 'grant_type=refresh_token' +
      '&refresh_token=' + encodeURIComponent(DROPBOX_REFRESH_TOKEN) +
      '&client_id=' + DROPBOX_APP_KEY +
      '&client_secret=' + DROPBOX_APP_SECRET;
    const options = {
      hostname: 'api.dropbox.com',
      path:     '/oauth2/token',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) resolve(json.access_token);
          else reject(new Error('Dropbox token error: ' + (json.error_description || json.error)));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function downloadFromDropbox(token, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'content.dropboxapi.com',
      path:     '/2/files/download',
      method:   'POST',
      headers: {
        'Authorization':   'Bearer ' + token,
        'Dropbox-API-Arg': JSON.stringify({ path }),
      },
    };
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => reject(new Error('Dropbox HTTP ' + res.statusCode + ': ' + body)));
        return;
      }
      let fileDate = null;
      try {
        const meta = JSON.parse(res.headers['dropbox-api-result'] || '{}');
        fileDate = meta.client_modified || meta.server_modified || null;
      } catch(e) {}
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), fileDate }));
    });
    req.on('error', reject);
    req.end();
  });
}

function normalizeRow(row) {
  const n = (v) => parseFloat(v) || 0;
  return {
    ref_neoludis:     String(row.ref_neoludis     || '').trim(),
    designation:      String(row.designation      || '').trim(),
    ean:              String(row.ean              || '').trim(),
    editeur:          String(row.editeur          || '').trim(),
    ref_editeur:      String(row.ref_editeur      || '').trim(),
    ref_ldg:          String(row.ref_ldg          || '').trim(),
    ref_goliath:      String(row.ref_goliath      || '').trim(),
    code_fournisseur: String(row.code_fournisseur || '').trim(),
    stock_neoludis:   n(row.stock_neoludis),
    reserve_neoludis: n(row.reserve_neoludis),
    dispo_neoludis:   n(row.dispo_neoludis),
    stock_editeur:    n(row.stock_editeur),
    reserve_editeur:  n(row.reserve_editeur),
    dispo_editeur:    n(row.dispo_editeur),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { editeur } = req.query;
  if (!editeur) return res.status(400).json({ success: false, error: 'Parametre editeur requis' });
  if (!DROPBOX_REFRESH_TOKEN || !DROPBOX_APP_KEY || !DROPBOX_APP_SECRET) {
    return res.status(500).json({ success: false, error: 'Variables Dropbox manquantes (DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET)' });
  }
  try {
    const token = await getAccessToken();
    const { buffer, fileDate } = await downloadFromDropbox(token, DROPBOX_PATH);
    const XLSX = require('xlsx');
    const wb   = XLSX.read(buffer, { type: 'buffer' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    let articles = rows
      .map(normalizeRow)
      .filter(a => a.ref_neoludis && a.editeur.toLowerCase() === editeur.toLowerCase());
    const stats = {
      total_refs:       articles.length,
      total_stock_neo:  articles.reduce((s, a) => s + a.stock_neoludis, 0),
      total_stock_edit: articles.reduce((s, a) => s + a.stock_editeur,  0),
      refs_en_stock:    articles.filter(a => a.stock_editeur > 0).length,
      refs_rupture:     articles.filter(a => a.stock_editeur === 0).length,
    };
    res.json({ success: true, editeur, articles, stats, fileDate });
  } catch (err) {
    console.error('[get-stock] Erreur :', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
