-- À exécuter une fois dans Supabase : Dashboard → SQL Editor → New query → colle tout → Run

-- Table qui stocke le catalogue complet (un seul rang, comme le faisait Netlify Blobs)
create table if not exists nolabel26_catalog (
  id text primary key default 'main',
  products jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Ligne de départ avec un catalogue vide (le site affichera les produits de démo
-- tant que l'admin n'a rien enregistré)
insert into nolabel26_catalog (id, products)
values ('main', '[]'::jsonb)
on conflict (id) do nothing;

-- Table qui stocke les tentatives de connexion admin (anti force-brute)
create table if not exists nolabel26_login_attempts (
  ip_hash text primary key,
  count integer not null default 0,
  first_attempt timestamptz not null default now()
);

-- Sécurité : ces tables ne sont accédées que par les fonctions serveur (Vercel)
-- via la clé "service_role", qui contourne les policies RLS. On active quand
-- même RLS pour empêcher tout accès direct depuis le navigateur avec la clé
-- publique "anon".
alter table nolabel26_catalog enable row level security;
alter table nolabel26_login_attempts enable row level security;
