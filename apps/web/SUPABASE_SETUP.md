# Configuration Supabase

## 1. Vercel Dashboard

Dans **Settings > Environment Variables**, ajouter :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iocwhdfqrbjhahttqpkw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (voir .env.local) |

## 2. Supabase Dashboard — Créer les tables

Dans **SQL Editor**, exécuter le contenu de `supabase/migrations/001_initial.sql`.

Ce script crée les tables :
- `hikes` — randonnées avec métadonnées (waypoints en jsonb)
- `gear_items` — équipement par randonnée
- `tracks` — enregistrements GPS

RLS est désactivé pour le MVP (pas d'authentification).

## 3. Variables locales

Copier `.env.local.example` en `.env.local` et remplir les valeurs.
Le fichier `.env.local` est dans `.gitignore` et ne doit jamais être commité.
