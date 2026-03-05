// api/index.js  —  Routeur unique Neoludis
// Toutes les routes passent par /api/index?action=X
// Remplace les 9 fonctions séparées → 1 seule fonction Vercel
//
// Actions disponibles :
//   GET  check-order          ?editeur&commande
//   POST verify-password      body: {editeur,password}
//   GET  get-suivi            ?editeur[&ref][&mode=commandes]
//   GET  get-suivi-sav        ?editeur
//   GET  get-stock            ?editeur[&depot]
//   POST import-backers       ?mode=backers   body: {editeur,backers}
//   POST import-commandes                     body: {editeur,csvBase64,filename}
//   POST import-sav                           body: {editeur,csvBase64,filename}
//   POST import-coliship      [?mode=reconcile]
//   POST reconcile-colis
//   POST update-status        body: {editeur,refs,statut}
//   POST update-status-commande body: {editeur,ref,statut}
//   POST update-status-sav    body: {editeur,ref,statut}
//   POST save-response        (délégué)
//   POST send-emails          (délégué)
//   POST update-backer        (délégué)
//   POST export-dropbox       (délégué)
//   POST auth-colissimo       (délégué)

import checkOrderHandler      from '../lib/check-order.js';
import getSuiviHandler        from '../lib/get-suivi.js';
import updateStatusHandler    from '../lib/update-status.js';
import reconcileColisHandler  from '../lib/reconcile-colis.js';
import importColishipHandler  from '../lib/import-coliship.js';
import importBackersHandler   from '../lib/import-backers.js';

import getStockHandler from '../lib/get-stock.js';

// ── Helpers ──────────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Déléguer vers une autre fonction Vercel du même projet (interne)
async function delegate(path, req, res) {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const qs   = new URLSearchParams(req.query || {}).toString();
  const url  = `${base}/api/${path}${qs ? '?' + qs : ''}`;
  const resp = await fetch(url, {
    method:  req.method,
    headers: { 'Content-Type': 'application/json' },
    body:    req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });
  const data = await resp.json();
  return res.status(resp.status).json(data);
}

// ── Handler principal ─────────────────────────────────────────
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query?.action || '';

  // ── Routage GET ───────────────────────────────────────────
  if (req.method === 'GET') {
    if (action === 'check-order')   return checkOrderHandler(req, res);
    if (action === 'get-suivi')     return getSuiviHandler(req, res);
    if (action === 'get-suivi-sav') {
      // Lire l'onglet SAV depuis Google Sheets
      try {
        const { getAccessToken } = await import('../api/_google-auth.js');
        const token    = await getAccessToken('https://www.googleapis.com/auth/spreadsheets.readonly');
        const editeur  = req.query?.editeur || '';
        const SHEET_ID = process.env.GOOGLE_SHEET_ID;
        const r        = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('SAV!A:Q')}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await r.json();
        if (data.error) throw new Error(data.error.message);
        const dossiers = (data.values || []).slice(1)
          .filter(row => (row[1]||'').toLowerCase() === editeur.toLowerCase())
          .map(row => ({
            date_import:   row[0]  || '',
            editeur:       row[1]  || '',
            fichier:       row[2]  || '',
            ref:           row[3]  || '',
            prenom:        row[4]  || '',
            nom:           row[5]  || '',
            email:         row[6]  || '',
            tel:           row[7]  || '',
            article:       row[13] || '',
            piece:         row[14] || '',
            statut:        row[15] || 'En attente',
            numero_suivi:  row[16] || '',
          }));
        return res.status(200).json({ success: true, dossiers });
      } catch(err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }
    if (action === 'get-stock')     return getStockHandler(req, res);
    return res.status(404).json({ error: 'Action GET inconnue : ' + action });
  }

  // ── Routage POST ──────────────────────────────────────────
  if (req.method === 'POST') {
    // check-order en mode password
    if (action === 'verify-password') {
      // Vérification mot de passe inline (évite dépendance sur req.query mutable)
      const { editeur, password } = req.body || {};
      if (!password) return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
      try {
        const raw       = process.env.ADMIN_PASSWORDS || '{}';
        const passwords = JSON.parse(raw);
        const key       = editeur || '';
        const expected  = passwords[key];
        if (!expected) return res.status(200).json({ ok: false, error: 'Éditeur inconnu' });
        return res.status(200).json({ ok: password === expected });
      } catch(e) {
        console.error('[verify-password] erreur:', e.message);
        return res.status(500).json({ ok: false, error: 'Config mots de passe invalide' });
      }
    }
    // import-backers
    if (action === 'import-backers') {
      req.query.mode = 'backers';
      return importBackersHandler(req, res);
    }
    if (action === 'import-commandes') {
      req.query.mode = 'commandes';
      return importBackersHandler(req, res);
    }
    if (action === 'import-sav') {
      req.query.mode = 'sav';
      return importBackersHandler(req, res);
    }
    // update-status
    if (action === 'update-status') {
      delete req.query.mode;
      return updateStatusHandler(req, res);
    }
    if (action === 'update-status-commande') {
      req.query.mode = 'commande';
      return updateStatusHandler(req, res);
    }
    if (action === 'update-status-sav') {
      req.query.mode = 'sav';
      return updateStatusHandler(req, res);
    }
    // coliship
    if (action === 'import-coliship')  return importColishipHandler(req, res);
    if (action === 'reconcile-colis')  return reconcileColisHandler(req, res);
    // délégués (restent leurs propres fichiers Vercel, pas exposés publiquement)
    if (action === 'save-response')    return delegate('save-response',  req, res);
    if (action === 'send-emails')      return delegate('send-emails',    req, res);
    if (action === 'update-backer')    return delegate('update-backer',  req, res);
    if (action === 'export-dropbox')   return delegate('export-dropbox', req, res);
    if (action === 'auth-colissimo')   return delegate('auth-colissimo', req, res);

    return res.status(404).json({ error: 'Action POST inconnue : ' + action });
  }

  return res.status(405).json({ error: 'Méthode non supportée' });
}
