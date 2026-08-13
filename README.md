# Agent community manager

Un agent IA qui écrit les publications d'une entreprise **adaptées réseau par réseau**
(Instagram, Facebook, LinkedIn, X, TikTok, YouTube) et qui prépare les **réponses aux
commentaires et messages** au ton de la marque.

Next.js 16 (App Router) + AI SDK v7 + Vercel AI Gateway.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseigner une clé (voir ci-dessous)
npm run dev
```

Deux fournisseurs possibles, choisis automatiquement selon la clé présente :

| | Clé | Coût | Qualité FR |
|---|---|---|---|
| **Google AI Studio** (défaut si la clé est là) | https://aistudio.google.com/apikey | Gratuit, sans carte | Correcte |
| **Vercel AI Gateway** | Dashboard Vercel → équipe → AI | Crédits achetés | Excellente (Claude) |

⚠️ Le palier **gratuit** de l'AI Gateway ne suffit pas : il renvoie `403` sur tous les
modèles Anthropic et `429` sur les modèles ouverts dès qu'on génère une vraie campagne.
Le plan Vercel Pro n'y change rien — l'AI Gateway se facture en crédits achetés, à part.

## Ce que fait l'agent

**Onglet « Créer des posts »** — un brief (sujet + objectif + réseaux) donne une campagne
complète, streamée au fur et à mesure : un angle éditorial commun, puis un post par réseau
avec accroche, corps, CTA, hashtags, brief visuel, et un script vidéo pour TikTok/YouTube.
Le compteur de caractères passe en rouge si le post dépasse la limite du réseau.

**Onglet « Répondre »** — on colle un commentaire ou un DM, l'agent renvoie le sentiment,
l'intention, la priorité, s'il faut escalader vers un humain, s'il faut basculer en privé,
et 2-3 variantes de réponse prêtes à publier.

**Profil de marque** — nom, secteur, audience, ton, interdits. Stocké dans le navigateur
(localStorage) et réinjecté dans chaque prompt.

## Garde-fous intégrés

Le prompt système interdit à l'agent d'inventer un chiffre, un prix, une date, un
témoignage client ou une récompense : ces éléments sortent en `[à confirmer]`.
Sur les réponses, il ne promet ni geste commercial ni délai non validé, et il escalade
dès qu'il y a litige, donnée personnelle, paiement ou santé.

## Structure

```
src/lib/networks.ts   Contraintes par réseau (limites, hashtags, règles éditoriales)
src/lib/schema.ts     Schémas Zod partagés client/serveur + objectifs
src/lib/agent.ts      Prompt système CM + modèle + bloc profil de marque
src/app/api/generate  Génération de campagne (streamText + Output.object, streaming)
src/app/api/reply     Analyse et réponse à un message reçu
src/components        UI (profil, génération, réponses, carte de post)
```

## Modèle

`src/lib/agent.ts` choisit le fournisseur : si `GOOGLE_GENERATIVE_AI_API_KEY` est
définie, il passe par Google en direct (`gemini-2.5-flash`), sinon par l'AI Gateway
(`anthropic/claude-sonnet-5`). `CM_MODEL` surcharge le modèle dans les deux cas.

## Déploiement

```bash
npm i -g vercel
vercel                       # lie le projet
vercel env add AI_GATEWAY_API_KEY
vercel --prod
```

# cm
