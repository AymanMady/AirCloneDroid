# MyRemoteDroid — Web (Next.js)

Interface web moderne (React / Next.js) pour piloter un téléphone Android.

## Architecture

```
Navigateur ──> Next.js (ce projet, sur le PC) ──Wi-Fi──> Téléphone (APK)
               • UI React (Tailwind)                      • Serveur PAW natif
               • API routes (/api/*) = backend            • API JSON du matériel
                 s'authentifie au téléphone (PIN)           (SMS, contacts, caméra…)
```

Le navigateur ne parle jamais directement au téléphone : il appelle les **API
routes Next.js** (`/api/phone/...`), qui se connectent au téléphone avec le code
PIN (login → cookie de session) et relaient les requêtes. Le code qui accède au
matériel (SMS, caméra, micro, contacts…) **reste natif sur le téléphone** — c'est
une contrainte Android, Node.js ne peut pas y accéder.

## Démarrer

Prérequis : Node.js 18+.

```bash
npm install
npm run dev     # développement, http://localhost:3000
# ou, en production :
npm run build && npm start
```

Côté téléphone : installer l'APK (`../app/build/outputs/apk/debug/app-debug.apk`),
lancer le serveur dans l'app — l'**adresse IP** et le **code de connexion (PIN)**
s'affichent à l'écran. Le PC et le téléphone doivent être sur le même Wi-Fi.

Au premier lancement, l'interface demande l'IP, le port (7575) et le PIN. La
configuration est enregistrée dans `.phone-config.json` (non versionné). On peut
aussi la pré-remplir par variables d'environnement : `PHONE_HOST`, `PHONE_PORT`,
`PHONE_PIN`.

## Fonctionnalités

SMS (lire / envoyer), Contacts (lister / ajouter), Journal d'appels, Fichiers
(explorer / télécharger), Applications (lister / télécharger l'APK), et Outils :
synthèse vocale, caméra, microphone, fond d'écran, envoi d'e-mail.

## Structure

- `app/api/phone/[...path]/route.ts` — proxy authentifié générique vers le téléphone
- `app/api/config/route.ts` — lecture/écriture de la config + test de connexion
- `lib/phone.ts` — login PIN, gestion du cookie de session, `phoneFetch`
- `lib/api.ts` — helpers côté client
- `components/` — `Dashboard`, `SettingsModal`, `panels/*`
