// lib/get-stock.js
// Lit stock_site.xlsx depuis Dropbox (généré chaque nuit par le serveur OVH)

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
const DROPBOX_APP_KEY       = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET    = process.env.DROPBOX_APP_SECRET;
const DROPBOX_PATH          = '/Neoludis/Preparation de commandes/Sources_BL/stock_site.xlsx';

// ── Obtenir un token Dropbox frais via OAuth ───────────────
async function getDropboxToken() {
  const body = 'grant_type=refresh_token' +
    '&refresh_token=' + encodeURIComponent(DROPBOX_REFRESH_TOKEN) +
    '&client_id='     + DROPBOX_APP_KEY +
    '&client_secret=' + DROPBOX_APP_SECRET;
  const res  = await fetch('https://api.dropbox.com/oauth2/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Dropbox token error: ' + (data.error_description || data.error));
  return data.access_token;
}

// ── Télécharger le fichier depuis Dropbox ──────────────────
async function downloadFromDropbox(token, path) {
  const res = await fetch('https://content.dropboxapi.com/2/files/download', {
    method:  'POST',
    headers: {
      'Authorization':   `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({ path }),
    },
  });
  if (!res.ok) throw new Error(`Dropbox HTTP ${res.status}: ${await res.text()}`);
  let fileDate = null;
  try {
    const meta = JSON.parse(res.headers.get('dropbox-api-result') || '{}');
    fileDate = meta.client_modified || meta.server_modified || null;
  } catch(e) {}
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, fileDate };
}

// ── Normaliser une ligne brute en objet article ────────────
function normalizeRow(row) {
  const n = (v) => parseFloat(v) || 0;
  return {
    ref_neoludis:     String(row.ref_neoludis     || '').trim(),
    designation:      String(row.designation      || '').trim(),
    ean:              String(row.ean              || '').trim(),
    editeur:          String(row.editeur || row.Editeur || row['Éditeur'] || row['editeur'] || '').trim(),
    ref_editeur:      String(row.ref_editeur      || '').trim(),
    ref_ldg:          String(row.ref_ldg          || '').trim(),
    ref_goliath:      String(row.ref_goliath       || '').trim(),
    code_fournisseur: String(row.code_fournisseur || '').trim(),
    stock_neoludis:   n(row.stock_neoludis),
    reserve_neoludis: n(row.reserve_neoludis),
    dispo_neoludis:   n(row.dispo_neoludis),
    stock_editeur:    n(row.stock_editeur),
    reserve_editeur:  n(row.reserve_editeur),
    dispo_editeur:    n(row.dispo_editeur),
  };
}

// ── Handler principal ───────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { editeur, depot } = req.query;

  if (!editeur) {
    return res.status(400).json({ success: false, error: 'Paramètre editeur requis' });
  }

  try {
    // 1. Obtenir token Dropbox frais + télécharger
    const token = await getDropboxToken();
    const { buffer, fileDate } = await downloadFromDropbox(token, DROPBOX_PATH);

    // 2. Parser le xlsx avec SheetJS
    const wb   = XLSX.read(buffer, { type: 'buffer' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    // 3. Normaliser + filtrer par éditeur
    let articles = rows.map(normalizeRow).filter(a => a.ref_neoludis && a.editeur.toLowerCase() === editeur.toLowerCase());

    // 4. Filtrer par dépôt si demandé
    if (depot === 'neoludis') {
      articles = articles.map(a => ({ ...a, stock_editeur: 0, reserve_editeur: 0, dispo_editeur: 0 }));
    } else if (depot === 'editeur') {
      articles = articles.map(a => ({ ...a, stock_neoludis: 0, reserve_neoludis: 0, dispo_neoludis: 0 }));
    }

    // 5. Stats
    const stats = {
      total_refs:       articles.length,
      total_stock_neo:  articles.reduce((s, a) => s + a.stock_neoludis, 0),
      total_stock_edit: articles.reduce((s, a) => s + a.stock_editeur,  0),
      refs_en_stock:    articles.filter(a => a.dispo_neoludis > 0 || a.dispo_editeur > 0).length,
      refs_rupture:     articles.filter(a => a.dispo_neoludis === 0 && a.dispo_editeur === 0).length,
    };

    res.json({ success: true, editeur, articles, stats, fileDate });

  } catch (err) {
    console.error('[get-stock] Erreur :', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

}
