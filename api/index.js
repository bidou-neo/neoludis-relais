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

import checkOrderHandler      from './check-order.js';
import getSuiviHandler        from './get-suivi.js';
import updateStatusHandler    from './update-status.js';
import reconcileColisHandler  from './reconcile-colis.js';
import importColishipHandler  from './import-coliship.js';
import importBackersHandler   from './import-backers.js';

// get-stock utilise encore CommonJS (require)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const getStockHandler = require('./get-stock.js');

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
    if (action === 'get-suivi-sav') return getSuiviSav(req, res);
    if (action === 'get-stock')     return getStockHandler(req, res);
    return res.status(404).json({ error: 'Action GET inconnue : ' + action });
  }

  // ── Routage POST ──────────────────────────────────────────
  if (req.method === 'POST') {
    // check-order en mode password
    if (action === 'verify-password') {
      req.query.mode = 'password';
      return checkOrderHandler(req, res);
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
