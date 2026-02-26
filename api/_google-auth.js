// api/_google-auth.js - Module d'auth Google partagé
import { createSign } from 'crypto';

export async function getAccessToken(scope = 'https://www.googleapis.com/auth/spreadsheets') {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const now   = Math.floor(Date.now() / 1000);

  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header  = b64({ alg: 'RS256', typ: 'JWT' });
  const payload = b64({
    iss: email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  });

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(key, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Auth Google échouée: ' + JSON.stringify(data));
  return data.access_token;
}
