// api/import-coliship.js
// POST              → import des CSV Coliship depuis Dropbox
// POST ?mode=reconcile → reconciliation depuis l'onglet Colis

import { getAccessToken } from '../api/_google-auth.js';

const SHEET_ID        = process.env.GOOGLE_SHEET_ID;
const DROPBOX_TOKEN   = process.env.DROPBOX_TOKEN;
const DROPBOX_FOLDER  = '/Neoludis/Preparation de commandes/BtoC/suivi expedition';
const DROPBOX_ARCHIVE = `${DROPBOX_FOLDER}/Archives`;

async function dropboxPost(endpoint, body) {
  const res = await fetch(`https://api.dropboxapi.com/2/${endpoint}`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${DROPBOX_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error_summary) throw new Error(`Dropbox ${endpoint}: ${data.error_summary}`);
  return data;
}

async function listCSVFiles() {
  const data = await dropboxPost('files/list_folder', { path: DROPBOX_FOLDER, recursive: false });
  return (data.entries || []).filter(e => e['.tag'] === 'file' && e.name.toLowerCase().endsWith('.csv'));
}

async function downloadFile(path) {
  const res = await fetch('https://content.dropboxapi.com/2/files/download', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${DROPBOX_TOKEN}`, 'Dropbox-API-Arg': JSON.stringify({ path }) },
  });
  if (!res.ok) throw new Error(`Dropbox download HTTP ${res.status}`);
  return await res.text();
}

async function moveToArchive(path, name) {
  try {
    await dropboxPost('files/move_v2', { from_path: path, to_path: `${DROPBOX_ARCHIVE}/${name}`, autorename: true });
  } catch(e) {
    console.warn(`Archivage échoué pour ${name}:`, e.message);
  }
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map(line => {
    const cols = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
    return { ref: cols[0] || '', numero: cols[4] || '' };
  }).filter(r => r.ref && r.numero);
}

async function sheetsRead(token, range) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sheets read: ${data.error.message}`);
  return data.values || [];
}

async function sheetsUpdate(token, updates) {
  if (!updates.length) return;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ valueInputOption: 'USER_ENTERED', data: updates }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sheets update: ${data.error.message}`);
}

async function sheetsAppend(token, range, rows) {
  if (!rows.length) return;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ values: rows }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sheets append: ${data.error.message}`);
}

async function upsertColisSheet(token, mappings) {
  const existing = await sheetsRead(token, 'Colis!A:B');
  const existingMap = new Map();
  existing.forEach((row, i) => {
    if (i === 0) return;
    if (row[0]) existingMap.set(String(row[0]).toLowerCase(), i + 1);
  });
  const now     = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  const updates = [];
  const toAdd   = [];
  for (const [ref, numero] of mappings) {
    if (existingMap.has(ref)) {
      const rowNum = existingMap.get(ref);
      updates.push({ range: `Colis!B${rowNum}`, values: [[numero]] });
      updates.push({ range: `Colis!C${rowNum}`, values: [[now]] });
    } else {
      toAdd.push([ref, numero, now]);
    }
  }
  await sheetsUpdate(token, updates);
  if (!existing.length) await sheetsAppend(token, 'Colis!A1', [['ref', 'numero_colis', 'date_import']]);
  await sheetsAppend(token, 'Colis!A:A', toAdd);
  return { updated: updates.length / 2, added: toAdd.length };
}

async function matchBackers(token, mappings) {
  const rows    = await sheetsRead(token, 'Backers!A:I');
  const updates = [];
  rows.forEach((row, i) => {
    if (i === 0) return;
    const ref      = String(row[1] || '').toLowerCase();
    const dejaColis = row[8] && row[8].trim();
    if (!dejaColis && mappings.has(ref)) {
      updates.push({ range: `Backers!I${i + 1}`, values: [[mappings.get(ref)]] });
      updates.push({ range: `Backers!H${i + 1}`, values: [['Expédié']] });
    }
  });
  await sheetsUpdate(token, updates);
  return updates.length / 2;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const mode = req.query?.mode || 'import';

  try {
    const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets');

    // ── Mode réconciliation ──────────────────────────────────
    if (mode === 'reconcile') {
      const colis = await sheetsRead(token, 'Colis!A:B');
      const mappings = new Map();
      colis.forEach((row, i) => {
        if (i === 0) return;
        if (row[0] && row[1]) mappings.set(String(row[0]).toLowerCase(), row[1]);
      });
      if (!mappings.size) return res.status(200).json({ success: true, mis_a_jour: 0 });
      const mis_a_jour = await matchBackers(token, mappings);
      return res.status(200).json({ success: true, mis_a_jour });
    }

    // ── Mode réconciliation commandes ───────────────────────────
    if (mode === 'reconcile-commandes') {
      const colis = await sheetsRead(token, 'Colis!A:B');
      const mappings = new Map();
      colis.forEach((row, i) => {
        if (i === 0) return;
        if (row[0] && row[1]) mappings.set(String(row[0]).toLowerCase(), row[1]);
      });
      if (!mappings.size) return res.status(200).json({ success: true, mis_a_jour: 0 });

      // Lire onglet Commandes col D (ref commande) et Q (numero_colis)
      const rows    = await sheetsRead(token, 'Commandes!A:Q');
      const updates = [];
      rows.forEach((row, i) => {
        if (i === 0) return;
        const ref      = String(row[3] || '').toLowerCase();
        const dejaColis = row[16] && row[16].trim();
        if (!dejaColis && mappings.has(ref)) {
          updates.push({ range: `Commandes!Q${i + 1}`, values: [[mappings.get(ref)]] });
          updates.push({ range: `Commandes!P${i + 1}`, values: [['Expédié']] });
        }
      });

      if (updates.length) {
        const res2 = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values:batchUpdate`,
          {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify({ valueInputOption: 'USER_ENTERED', data: updates }),
          }
        );
        const d = await res2.json();
        if (d.error) throw new Error(d.error.message);
      }

      return res.status(200).json({ success: true, mis_a_jour: updates.length / 2 });
    }

    // ── Mode import normal ───────────────────────────────────
    if (!DROPBOX_TOKEN) return res.status(500).json({ error: 'DROPBOX_TOKEN manquant' });

    const files = await listCSVFiles();
    if (!files.length) {
      return res.status(200).json({ success: true, fichiers: 0, mis_a_jour: 0, stockes: 0 });
    }

    const mappings = new Map();
    for (const file of files) {
      const text = await downloadFile(file.path_lower);
      parseCSV(text).forEach(r => mappings.set(r.ref.toLowerCase(), r.numero));
    }

    const colisResult = await upsertColisSheet(token, mappings);
    const mis_a_jour  = await matchBackers(token, mappings);

    for (const file of files) await moveToArchive(file.path_lower, file.name);

    return res.status(200).json({
      success:     true,
      fichiers:    files.length,
      references:  mappings.size,
      stockes:     colisResult.added + colisResult.updated,
      mis_a_jour,
      sans_backer: mappings.size - mis_a_jour,
    });

  } catch (err) {
    console.error('[import-coliship]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
