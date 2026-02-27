// api/send-emails.js
// Envoie un email personnalisé à chaque backer avec son lien
// POST { editeur, backers: [{ref, prenom, nom, email, lien}] }

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = 'expedition@neoludis.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Méthode non autorisée' });

  const { editeur, backers } = req.body;
  if (!editeur || !backers?.length) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  const resultats = [];

  for (const backer of backers) {
    if (!backer.email) {
      resultats.push({ ref: backer.ref, statut: 'ignoré', raison: 'pas d\'email' });
      continue;
    }

    const prenom = backer.prenom || 'cher client';
    // Logo éditeur — URL directe sans détection dynamique
    const logoUrl = `https://neoludis-relais.vercel.app/logos/${editeur}.gif`;
    const logoHtml = `<div style="text-align:center;margin-bottom:24px;padding:16px;background-color:#1a1a1a;border-radius:8px"><img src="${logoUrl}" alt="${editeur}" style="max-height:80px;max-width:260px"></div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">${logoHtml}<p style="font-size:16px">Bonjour ${prenom},</p><p style="font-size:15px;line-height:1.6">Votre commande est prête à être expédiée.<br>Cliquez sur le lien ci-dessous pour choisir votre mode de livraison :</p><div style="text-align:center;margin:32px 0"><a href="${backer.lien}" style="background-color:#E8431A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold">Choisir ma livraison →</a></div><p style="font-size:13px;color:#888;margin-top:32px">Cordialement,<br>L'équipe ${editeur} / Neoludis</p></body></html>`;

    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${editeur} <${FROM_EMAIL}>`,
          to:   [backer.email],
          subject: `Choisissez votre mode de livraison - ${editeur}`,
          html,
        }),
      });
      const data = await r.json();
      if (data.id) {
        resultats.push({ ref: backer.ref, email: backer.email, statut: 'envoyé' });
      } else {
        resultats.push({ ref: backer.ref, email: backer.email, statut: 'erreur', raison: data.message || JSON.stringify(data) });
      }
    } catch (err) {
      resultats.push({ ref: backer.ref, email: backer.email, statut: 'erreur', raison: err.message });
    }

    // Petite pause pour ne pas dépasser les limites de l'API
    await new Promise(r => setTimeout(r, 100));
  }

  const envoyes = resultats.filter(r => r.statut === 'envoyé').length;
  const erreurs = resultats.filter(r => r.statut === 'erreur').length;

  return res.status(200).json({ success: true, envoyes, erreurs, resultats });
}
