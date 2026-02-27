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

  const { editeur, backers, subject: customSubject, body: customBody } = req.body;
  if (!editeur || !backers?.length) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  // Template par défaut si non fourni
  const subjectTemplate = customSubject || `Choisissez votre mode de livraison - ${editeur}`;
  const bodyTemplate    = customBody    || `Bonjour {prenom},\n\nVotre commande est prête à être expédiée.\nCliquez sur le lien ci-dessous pour choisir votre mode de livraison :\n\n{lien}\n\nCordialement,\nL'équipe {editeur} / Neoludis`;

  const replace = (str, backer) => str
    .replace(/{prenom}/g,  backer.prenom || 'cher client')
    .replace(/{editeur}/g, editeur)
    .replace(/{lien}/g,    backer.lien || '');

  const resultats = [];

  for (const backer of backers) {
    if (!backer.email) {
      resultats.push({ ref: backer.ref, statut: 'ignoré', raison: 'pas d\'email' });
      continue;
    }

    const prenom = backer.prenom || 'cher client';
    const sujet  = replace(subjectTemplate, backer);
    const corps  = replace(bodyTemplate, backer);

    // Convertir le corps texte en HTML (remplacer les sauts de ligne, et le lien en bouton)
    const corpsHtml = corps
      .replace(/\n/g, '<br>')
      .replace(
        backer.lien,
        `<div style="text-align:center;margin:24px 0"><a href="${backer.lien}" style="background-color:#E8431A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold">Choisir ma livraison →</a></div>`
      );

    // Logo éditeur — URL directe sans détection dynamique
    const logoUrl = `https://neoludis-relais.vercel.app/logos/${editeur}.gif`;
    const logoHtml = `<div style="text-align:center;margin-bottom:24px;padding:16px;background-color:#1a1a1a;border-radius:8px"><img src="${logoUrl}" alt="${editeur}" style="max-height:80px;max-width:260px"></div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">${logoHtml}${corpsHtml}</body></html>`;

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
          subject: sujet,
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
