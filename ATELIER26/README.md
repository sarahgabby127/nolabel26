# NOLABEL26 — Déploiement sur Vercel + Supabase

Ce dossier contient ton site complet avec un vrai serveur (Vercel Functions) qui
vérifie le mot de passe admin et stocke tes produits dans une base de données
Supabase. Le mot de passe n'est **jamais** présent dans le code du site —
impossible à trouver même en inspectant la page.

## 1. Créer un projet Supabase (gratuit)
1. Va sur https://supabase.com et crée un compte
2. Clique **"New project"**, choisis un nom (ex: `nolabel26`) et un mot de passe
   de base de données (garde-le de côté, pas besoin de le ressaisir plus tard)
3. Attends que le projet soit prêt (~2 minutes)

## 2. Créer les tables dans Supabase
1. Dans ton projet Supabase, va dans **SQL Editor → New query**
2. Ouvre le fichier `supabase.sql` de ce dossier, copie tout son contenu, colle-le
   dans l'éditeur, puis clique **Run**
3. Ça crée la table des produits et celle qui protège contre les tentatives de
   mot de passe répétées

## 3. Récupérer tes clés Supabase
1. Va dans **Project Settings → API**
2. Note les deux valeurs suivantes (tu en auras besoin à l'étape 5) :
   - **Project URL** → ex: `https://xxxxxxxx.supabase.co`
   - **service_role key** (dans "Project API keys", clique sur "Reveal") —
     ⚠️ cette clé est secrète, ne la mets jamais dans le code du site, seulement
     dans les variables d'environnement Vercel (étape 5)

## 4. Créer un compte Vercel (gratuit)
Va sur https://vercel.com et crée un compte (avec ton email ou GitHub).

## 5. Déployer le site
Option la plus simple (sans ligne de commande) :
1. Mets ce dossier (`nolabel26-vercel`) sur GitHub (crée un nouveau repo et
   pousse les fichiers), ou installe la CLI Vercel (`npm i -g vercel`) et lance
   `vercel` depuis ce dossier
2. Sur https://vercel.com → **"Add New" → "Project"** → importe ton repo GitHub
   (ou suis les instructions de la CLI)
3. Avant de cliquer sur Deploy, ouvre **Environment Variables** et ajoute :
   - `SUPABASE_URL` → l'URL de ton projet (étape 3)
   - `SUPABASE_SERVICE_ROLE_KEY` → la clé service_role (étape 3)
   - `ADMIN_PASSWORD` → ton mot de passe admin (choisis-en un solide, ex:
     `N0label26-2026!`)
   - `SESSION_SECRET` → une longue chaîne aléatoire, ex: `x7Kp2mVq9Lz4Rn8T`
     (change-la, invente la tienne)
4. Clique **Deploy**

Si le site est déjà déployé et que tu ajoutes les variables après coup : va
dans **Project Settings → Environment Variables**, ajoute-les, puis
**Deployments → ⋯ → Redeploy** pour qu'elles soient prises en compte.

Ces valeurs ne sont **jamais** visibles dans le code — elles vivent uniquement
dans la configuration privée de Vercel.

## 6. Relier ton nom de domaine
Dans **Project Settings → Domains → Add**, suis les instructions pour pointer
ton nom de domaine vers Vercel (ça se fait chez ton registrar, ex: chez qui tu
as acheté le domaine — Vercel te donne les valeurs DNS exactes à entrer).

## 7. Tester
- Ouvre ton site : les produits de démo doivent s'afficher
- Clique 20 fois sur "Ivoire" dans le footer → entre le mot de passe que tu as
  choisi dans `ADMIN_PASSWORD` → tu dois arriver dans l'espace admin
- Ajoute un produit, il doit apparaître sur la boutique après enregistrement
  (et être bien enregistré dans Supabase : Table Editor → `nolabel26_catalog`)

## Notes
- Le mot de passe admin donne un accès valable **4 heures**, ensuite il faut se
  reconnecter
- **Protection anti-force brute** : après 5 tentatives de mot de passe
  incorrectes depuis une même connexion, l'accès est bloqué 15 minutes avant de
  pouvoir réessayer
- Les produits sont stockés dans **Supabase** (base de données Postgres),
  incluse gratuitement dans le plan de démarrage
- Si tu veux changer le mot de passe plus tard, il suffit de modifier la
  variable `ADMIN_PASSWORD` dans Vercel (pas besoin de toucher au code)
- La clé `SUPABASE_SERVICE_ROLE_KEY` donne un accès total à ta base de données :
  elle ne doit exister que dans les variables d'environnement Vercel, jamais
  dans un fichier du site ni sur GitHub en clair
- **Navigation mobile** : les fenêtres (produit, connexion admin, panneau
  admin) se ferment maintenant proprement avec le bouton retour du téléphone,
  au lieu de faire quitter le site
