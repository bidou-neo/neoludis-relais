// api/import-backers.js
// POST ?mode=backers  { editeur, backers: [...] }  → import backers dans Sheets
// POST ?mode=commandes { editeur, csvBase64, filename } → import commande BtoC

import { getAccessToken } from './_google-auth.js';

const SHEET_ID              = process.env.GOOGLE_SHEET_ID;
const RESEND_KEY            = process.env.RESEND_API_KEY;
const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
const DROPBOX_APP_KEY       = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET    = process.env.DROPBOX_APP_SECRET;
const STOCK_EMAIL           = 'deoliveira@neoludis.com';
const DROPBOX_COMMANDES     = '/Neoludis/Preparation de commandes/BtoC/Commandes BtoC';

async function getDropboxToken() {
  const body = 'grant_type=refresh_token' +
    '&refresh_token=' + encodeURIComponent(DROPBOX_REFRESH_TOKEN) +
    '&client_id=' + DROPBOX_APP_KEY +
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

// ── Helpers Sheets ───────────────────────────────────────────
async function sheetsRead(token, range) {
  const res  = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sheets read: ${data.error.message}`);
  return data.values || [];
}

async function sheetsAppend(token, range, rows) {
  const res  = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ values: rows }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sheets append: ${data.error.message}`);
  return data;
}

// ── Parser CSV commandes BtoC ────────────────────────────────
function parseCommandesCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());

  // Ligne 1 : refs articles (à partir de la colonne 17, index 16 après split sur ;)
  const refsLine   = lines[0].split(';');
  const labelsLine = lines[1].split(';');
  const articles   = [];
  for (let i = 17; i < refsLine.length; i++) {
    if (refsLine[i]?.trim()) {
      articles.push({ ref: refsLine[i].trim(), label: labelsLine[i]?.trim() || '' });
    }
  }

  // Ligne 8 : entête colonnes commandes (index 7)
  // Lignes 9+ : commandes
  const commandes = [];
  for (let i = 8; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (!cols[0]?.trim()) continue;

    const qtés = {};
    for (let j = 0; j < articles.length; j++) {
      const qte = parseInt(cols[17 + j] || '0', 10);
      if (qte > 0) qtés[articles[j].ref] = qte;
    }

    const codeRelais = cols[13]?.trim() || '';
    commandes.push({
      ref:         cols[0]?.trim() || '',
      email:       cols[1]?.trim() || '',
      nom:         cols[3]?.trim() || '',
      prenom:      cols[4]?.trim() || '',
      adresse1:    cols[5]?.trim() || '',
      adresse2:    cols[6]?.trim() || '',
      cp:          cols[8]?.trim() || '',
      ville:       cols[9]?.trim() || '',
      pays:        cols[10]?.trim() || '',
      telephone:   (cols[14] || cols[15] || '').trim(),
      code_relais: codeRelais,
      mode:        codeRelais ? 'Relais' : 'Domicile',
      articles:    qtés,
    });
  }

  return { articles, commandes };
}

// ── Envoyer mail récap stock ─────────────────────────────────
async function envoyerMailRecap(editeur, filename, articles, commandes) {
  // Calculer les totaux par article
  const totaux = {};
  articles.forEach(a => { totaux[a.ref] = { label: a.label, total: 0 }; });
  commandes.forEach(cmd => {
    Object.entries(cmd.articles).forEach(([ref, qte]) => {
      if (totaux[ref]) totaux[ref].total += qte;
    });
  });

  const lignesArticles = Object.entries(totaux)
    .filter(([, v]) => v.total > 0)
    .map(([ref, v]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:0.9rem">${ref}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${v.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:#1A7A4A">${v.total}</td>
      </tr>`)
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto">
      <h2 style="color:#1a1a1a">📦 Récap sortie de stock — ${editeur}</h2>
      <p style="color:#555">Fichier importé : <strong>${filename}</strong><br>
      Nombre de commandes : <strong>${commandes.length}</strong></p>
      
      <h3 style="color:#1a1a1a;margin-top:24px">Articles à sortir du stock :</h3>
      <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#1a1a1a;color:white">
            <th style="padding:10px 12px;text-align:left">Référence</th>
            <th style="padding:10px 12px;text-align:left">Article</th>
            <th style="padding:10px 12px;text-align:center">Quantité</th>
          </tr>
        </thead>
        <tbody>${lignesArticles}</tbody>
      </table>

      <h3 style="color:#1a1a1a;margin-top:24px">Détail des commandes (${commandes.length}) :</h3>
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
        <thead>
          <tr style="background:#f0f0f0">
            <th style="padding:6px 10px;text-align:left">Réf</th>
            <th style="padding:6px 10px;text-align:left">Nom</th>
            <th style="padding:6px 10px;text-align:left">Mode</th>
            <th style="padding:6px 10px;text-align:left">Articles</th>
          </tr>
        </thead>
        <tbody>
          ${commandes.map(c => `
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:6px 10px;font-family:monospace">${c.ref}</td>
            <td style="padding:6px 10px">${c.prenom} ${c.nom}</td>
            <td style="padding:6px 10px">${c.mode === 'Relais' ? '📍 Relais ' + c.code_relais : '🏠 Domicile'}</td>
            <td style="padding:6px 10px">${Object.entries(c.articles).map(([r,q]) => `${r} x${q}`).join(', ')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p style="color:#999;font-size:0.8rem;margin-top:24px">Neoludis Relais — Import automatique</p>
    </div>`;

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Neoludis Relais <relais@neoludis.com>',
      to:      [STOCK_EMAIL],
      subject: `📦 Sortie stock ${editeur} — ${commandes.length} commandes — ${filename}`,
      html,
    }),
  });
}

// ── Upload CSV vers Dropbox ──────────────────────────────────
async function uploadDropbox(filename, csvBuffer) {
  const token = await getDropboxToken();
  const path  = `${DROPBOX_COMMANDES}/${filename}`;
  const res   = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method:  'POST',
    headers: {
      'Authorization':   `Bearer ${token}`,
      'Content-Type':    'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'add', autorename: true }),
    },
    body: csvBuffer,
  });
  if (!res.ok) throw new Error(`Dropbox upload HTTP ${res.status}`);
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Méthode non autorisée' });

  const mode = req.query?.mode || 'backers';

  // ── MODE BACKERS (existant) ──────────────────────────────────
  if (mode === 'backers') {
    const { editeur, backers } = req.body;
    if (!editeur || !backers?.length) return res.status(400).json({ error: 'Paramètres manquants' });

    try {
      const token    = await getAccessToken();
      const existing = await sheetsRead(token, 'Backers!A:C');
      const existingRefs = new Set(
        existing.slice(1)
          .filter(row => (row[0]||'').toLowerCase() === editeur.toLowerCase())
          .map(row => String(row[1]||'').toLowerCase())
      );
      const nouveaux = backers.filter(b => !existingRefs.has(String(b.ref||'').toLowerCase()));
      if (!nouveaux.length) return res.status(200).json({ success: true, importes: 0, message: 'Tous les backers existaient déjà' });

      const rows = nouveaux.map(b => [
        editeur,
        String(b.ref    || ''),
        String(b.email  || ''),
        String(b.prenom || ''),
        String(b.nom    || ''),
        b.telephone ? `'${b.telephone}` : '',
      ]);
      await sheetsAppend(token, 'Backers!A1', rows);
      return res.status(200).json({ success: true, importes: nouveaux.length, ignores: backers.length - nouveaux.length });

    } catch (err) {
      console.error('import-backers error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── MODE COMMANDES BtoC ──────────────────────────────────────
  if (mode === 'commandes') {
    const { editeur, csvBase64, filename } = req.body;
    if (!editeur || !csvBase64 || !filename) return res.status(400).json({ error: 'Paramètres manquants' });

    try {
      const csvBuffer = Buffer.from(csvBase64, 'base64');
      const csvText   = csvBuffer.toString('latin1');
      const { articles, commandes } = parseCommandesCSV(csvText);

      if (!commandes.length) return res.status(400).json({ error: 'Aucune commande trouvée dans le fichier' });

      // 1. Stocker dans Sheets onglet "Commandes"
      const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets');
      const now   = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
      const rows  = commandes.map(c => [
        now, editeur, filename, c.ref, c.prenom, c.nom, c.email,
        c.telephone, c.adresse1, c.adresse2, c.cp, c.ville, c.pays,
        Object.entries(c.articles).map(([r,q]) => `${r}×${q}`).join(' | '),
        c.mode + (c.code_relais ? ` (${c.code_relais})` : ''),
      ]);
      await sheetsAppend(token, 'Commandes!A1', rows);

      // 2. Envoyer mail récap
      await envoyerMailRecap(editeur, filename, articles, commandes);

      // 3. Uploader CSV dans Dropbox
      await uploadDropbox(filename, csvBuffer);

      return res.status(200).json({ success: true, commandes: commandes.length, articles: articles.length });

    } catch (err) {
      console.error('import-commandes error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Mode invalide (backers ou commandes)' });
}
