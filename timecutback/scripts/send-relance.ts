/**
 * Envoi automatique d'un email de relance à TOUS les utilisateurs Firebase.
 *
 * Sécurité : par défaut le script tourne en MODE SIMULATION (il liste les
 * destinataires sans rien envoyer). Ajoute le flag --send pour envoyer pour de vrai.
 *
 *   Simulation :  npx ts-node scripts/send-relance.ts
 *   Envoi réel :  npx ts-node scripts/send-relance.ts --send
 *
 * Prérequis (voir instructions) :
 *   - npm i nodemailer && npm i -D @types/nodemailer
 *   - Dans .env :  GMAIL_USER=ton.adresse@gmail.com
 *                  GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (mot de passe d'application)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as nodemailer from 'nodemailer';

const SEND = process.argv.includes('--send'); // sans ce flag => simulation
const APP_URL = 'https://timecut.fr';

// ─────────────────────────────────────────────────────────────
//  CONTENU DE L'EMAIL  (modifie librement le sujet et le corps)
// ─────────────────────────────────────────────────────────────
const SUBJECT = 'Ton premier clip viral avec TimeCut 🎬';

function buildText(name: string): string {
  return `Salut ${name},

Merci de t'être inscrit sur TimeCut !

TimeCut transforme tes longues vidéos en plusieurs clips courts (TikTok, Reels, Shorts),
avec sous-titres automatiques et traduits. Le tout en quelques clics.

👉 Génère ton premier clip ici : ${APP_URL}/newproject

Tu as 20 minutes offertes chaque mois pour tester, sans carte bancaire.
Une question ou un blocage ? Réponds simplement à cet email, je lis tout.

À très vite,
Jean-Hugues — TimeCut

—
Tu reçois cet email car tu as créé un compte sur TimeCut.
Réponds "STOP" si tu ne souhaites plus recevoir de messages.`;
}

function buildHtml(name: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1f2937;line-height:1.6">
  <h2 style="color:#7f13ec;margin-bottom:8px">Salut ${name},</h2>
  <p>Merci de t'être inscrit sur <strong>TimeCut</strong> !</p>
  <p>TimeCut transforme tes longues vidéos en plusieurs <strong>clips courts</strong>
  (TikTok, Reels, Shorts), avec <strong>sous-titres automatiques et traduits</strong>,
  en quelques clics.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="${APP_URL}/newproject"
       style="background:#7f13ec;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block">
      Générer mon premier clip
    </a>
  </p>
  <p>Tu as <strong>20 minutes offertes chaque mois</strong> pour tester, sans carte bancaire.</p>
  <p>Une question ou un blocage ? Réponds simplement à cet email, je lis tout.</p>
  <p>À très vite,<br/>Jean-Hugues — TimeCut</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="font-size:12px;color:#9ca3af">
    Tu reçois cet email car tu as créé un compte sur TimeCut.<br/>
    Réponds "STOP" si tu ne souhaites plus recevoir de messages.
  </p>
</div>`;
}

// ─────────────────────────────────────────────────────────────
//  Firebase Admin (réutilise les variables FIREBASE_* du .env)
// ─────────────────────────────────────────────────────────────
function initAdmin(): void {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Variables FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY manquantes dans .env',
    );
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

interface Recipient {
  email: string;
  name: string;
}

async function listAllUsers(): Promise<Recipient[]> {
  const auth = getAuth();
  const recipients: Recipient[] = [];
  let pageToken: string | undefined;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      if (!u.email) continue;
      recipients.push({
        email: u.email,
        name: u.displayName || u.email.split('@')[0],
      });
    }
    pageToken = res.pageToken;
  } while (pageToken);
  return recipients;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  initAdmin();
  const users = await listAllUsers();
  console.log(`\n${users.length} utilisateur(s) trouvé(s) dans Firebase.`);

  // TEST_TO : si défini, on n'envoie QU'à cette adresse (pour vérifier le rendu)
  const testTo = process.env.TEST_TO?.trim();
  const targets: Recipient[] = testTo ? [{ email: testTo, name: 'Test' }] : users;
  if (testTo) console.log(`MODE TEST : envoi uniquement à ${testTo}`);
  console.log('');

  if (!SEND) {
    console.log('— MODE SIMULATION : aucun email envoyé. Ajoute --send pour envoyer. —\n');
    targets.forEach((u) => console.log(`  → ${u.email}  (${u.name})`));
    console.log(`\nSujet : ${SUBJECT}`);
    return;
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD manquants dans .env');
  }

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  await transport.verify();
  console.log('Connexion SMTP Gmail OK. Envoi en cours...\n');

  let ok = 0;
  let fail = 0;
  for (const u of targets) {
    try {
      await transport.sendMail({
        from: `TimeCut <${user}>`,
        to: u.email,
        subject: SUBJECT,
        text: buildText(u.name),
        html: buildHtml(u.name),
      });
      ok += 1;
      console.log(`✓ ${u.email}`);
      await sleep(1500); // throttle léger pour ménager Gmail
    } catch (e) {
      fail += 1;
      console.error(`✗ ${u.email} : ${(e as Error).message}`);
    }
  }
  console.log(`\nTerminé : ${ok} envoyé(s), ${fail} échec(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
