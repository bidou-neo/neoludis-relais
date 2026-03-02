// api/import-coliship.js
// 1. Lit tous les CSV Coliship dans Dropbox
// 2. Stocke TOUS les couples ref→colis dans l'onglet "Colis" de Sheets (upsert)
// 3. Tente le matching avec l'onglet "Backers" → met à jour colonne I + statut H
// 4. Archive les CSV traités

import { getAccessToken } from './_google-auth.js';

const SHEET_ID        = process.env.GOOGLE_SHEET_ID;
const DROPBOX_TOKEN   = process.env.DROPBOX_TOKEN;
const DROPBOX_FOLDER  = '/Neoludis/Preparation de commandes/BtoC/suivi expedition';
const DROPBOX_ARCHIVE = `${DROPBOX_FOLDER}/Archives`;

// ── Dropbox helpers ─────────────────────────────────────────
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
    await dropboxPost('files/move_v2', {
      from_path:  path,
      to_path:    `${DROPBOX_ARCHIVE}/${name}`,
      autorename: true,
    });
  } catch(e) {
    console.warn(`Archivage échoué pour ${name}:`, e.message);
  }
}

// ── Parser CSV Coliship ─────────────────────────────────────
// "ReferenceExpedition";"NomDestinataire";"Prenom";"RaisonSociale";"NumeroColis"
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map(line => {
    const cols = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
    return { ref: cols[0] || '', numero: cols[4] || '' };
  }).filter(r => r.ref && r.numero);
}

// ── Sheets : lire un onglet ─────────────────────────────────
async function sheetsRead(token, range) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Sheets read: ${data.error.message}`);
  return data.values || [];
}

// ── Sheets : batchUpdate ────────────────────────────────────
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

// ── Sheets : append des nouvelles lignes dans onglet Colis ──
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

// ── Upsert onglet "Colis" ───────────────────────────────────
// Colonnes : A=ref, B=numero_colis, C=date_import
async function upsertColisSheet(token, mappings) {
  const existing = await sheetsRead(token, 'Colis!A:B');
  // Map ref_lower → row index (1-based, skip header)
  const existingMap = new Map();
  existing.forEach((row, i) => {
    if (i === 0) return;
    if (row[0]) existingMap.set(String(row[0]).toLowerCase(), i + 1);
  });

  const now     = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  const updates = [];
  const toAdd   = [];

  for (const [refLower, numero] of mappings) {
    if (existingMap.has(refLower)) {
      // Mettre à jour la ligne existante
      const rowNum = existingMap.get(refLower);
      updates.push({ range: `Colis!B${rowNum}`, values: [[numero]] });
      updates.push({ range: `Colis!C${rowNum}`, values: [[now]] });
    } else {
      // Chercher la ref originale (non-lowercased) dans les mappings d'origine
      toAdd.push([refLower, numero, now]);
    }
  }

  await sheetsUpdate(token, updates);
  // Ajouter l'entête si l'onglet est vide
  if (!existing.length) {
    await sheetsAppend(token, 'Colis!A1', [['ref', 'numero_colis', 'date_import']]);
  }
  await sheetsAppend(token, 'Colis!A:A', toAdd);

  return { updated: updates.length / 2, added: toAdd.length };
}

// ── Matching avec onglet Backers ────────────────────────────
async function matchBackers(token, mappings) {
  const rows    = await sheetsRead(token, 'Backers!A:I');
  const updates = [];

  rows.forEach((row, i) => {
    if (i === 0) return;
    const ref = String(row[1] || '').toLowerCase();
    if (mappings.has(ref)) {
      updates.push({ range: `Backers!I${i + 1}`, values: [[mappings.get(ref)]] });
      updates.push({ range: `Backers!H${i + 1}`, values: [['Expédié']] });
    }
  });

  await sheetsUpdate(token, updates);
  return updates.length / 2;
}

// ── Handler principal ───────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!DROPBOX_TOKEN) return res.status(500).json({ error: 'DROPBOX_TOKEN manquant' });

  try {
    const token = await getAccessToken('https://www.googleapis.com/auth/spreadsheets');

    const mode = req.query?.mode || 'import';

    // ── Mode réconciliation : relire l'onglet Colis et retenter le matching ──
    if (mode === 'reconcile') {
      const colis = await sheetsRead(token, 'Colis!A:B');
      const mappings = new Map();
      colis.forEach((row, i) => {
        if (i === 0) return; // skip header
        if (row[0] && row[1]) mappings.set(String(row[0]).toLowerCase(), row[1]);
      });
      if (!mappings.size) {
        return res.status(200).json({ success: true, mis_a_jour: 0, sans_backer: 0, message: 'Onglet Colis vide.' });
      }
      const mis_a_jour = await matchBackers(token, mappings);
      return res.status(200).json({ success: true, mis_a_jour, sans_backer: mappings.size - mis_a_jour });
    }

    // ── Mode import normal ───────────────────────────────────────────────────
    const files = await listCSVFiles();
    if (!files.length) {
      return res.status(200).json({ success: true, message: 'Aucun fichier CSV à traiter', fichiers: 0, mis_a_jour: 0, stockes: 0 });
    }

    const mappings = new Map(); // ref_lower → numero
    const detail   = [];
    for (const file of files) {
      const text = await downloadFile(file.path_lower);
      const rows = parseCSV(text);
      rows.forEach(r => mappings.set(r.ref.toLowerCase(), r.numero));
      detail.push({ nom: file.name, lignes: rows.length });
    }

    // Stocker TOUS les colis dans l'onglet "Colis" (upsert)
    const colisResult = await upsertColisSheet(token, mappings);

    // Tenter le matching avec Backers
    const mis_a_jour = await matchBackers(token, mappings);

    // Archiver les CSV
    for (const file of files) {
      await moveToArchive(file.path_lower, file.name);
    }

    return res.status(200).json({
      success:     true,
      fichiers:    files.length,
      references:  mappings.size,
      stockes:     colisResult.added + colisResult.updated,
      mis_a_jour,
      sans_backer: mappings.size - mis_a_jour,
      detail,
    });

  } catch (err) {
    console.error('[import-coliship]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
