@AGENTS.md

# Projet : agent community manager

Application Next.js qui rédige des publications adaptées à six réseaux
(Instagram, Facebook, LinkedIn, X, TikTok, YouTube) et prépare les réponses aux
commentaires, au ton d'une marque donnée.

## État actuel

Phase 1 terminée et vérifiée : génération et réponses fonctionnent, testées en réel.
L'application **ne publie pas** sur les réseaux — l'utilisateur copie-colle.
La phase 2 (publication automatique) est documentée dans
`docs/publication-automatique.md`, avec ses contraintes de validation par plateforme.

## Décisions déjà prises, à ne pas rediscuter

- **AI SDK v7** : `streamText` + `Output.object()`. `generateObject` n'existe plus.
- **Fournisseur** : `src/lib/agent.ts` choisit selon la clé présente. Si
  `GOOGLE_GENERATIVE_AI_API_KEY` est définie → Google direct (`gemini-3.5-flash`).
  Sinon → AI Gateway Vercel (`anthropic/claude-sonnet-5`).
- **Le palier gratuit de l'AI Gateway est inutilisable** : 403 sur tous les modèles
  Anthropic, 429 sur les modèles ouverts dès qu'on génère une vraie campagne. Le plan
  Vercel Pro n'y change rien, il faut des crédits achetés. Ne pas reproposer le Gateway
  gratuit comme solution.
- **`gemini-2.5-flash` est fermé aux nouveaux comptes Google** (404 « no longer available
  to new users »). Utiliser `gemini-3.5-flash` ou plus récent.
- **La génération se fait en deux temps** (`src/lib/generate-campaign.ts`) : un appel
  court fixe la ligne éditoriale, puis un appel par réseau, chacun avec toute l'attention
  du modèle. L'unique appel produisant les six posts d'un coup s'essoufflait sur les
  derniers réseaux. Le document JSON est assemblé à la main pour que chaque carte
  apparaisse dès qu'elle est prête.
- **Les contraintes mesurables sont vérifiées par le code**, pas par le modèle
  (`findViolations`) : longueur, nombre et forme des hashtags, titre, script. Un LLM
  compte mal les caractères. Une violation déclenche une passe de réparation ciblée qui
  nomme le défaut mesuré.
- **Palier gratuit Google : environ 20 requêtes par jour ET par modèle.** Mesuré, pas
  supposé : le message d'erreur annonce `limit: 20` et suggère de réessayer dans 20
  secondes, mais l'attente ne débloque rien — c'est bien un compteur journalier.
  Une campagne coûte 7 requêtes (1 brief + 6 réseaux), donc **2 à 3 campagnes par jour**.
  Quand un modèle est épuisé, en changer suffit : le compteur est par modèle.
  `CM_PIPELINE=single` repasse à 1 requête par campagne, `CM_CONCURRENCY` borne le
  parallélisme (défaut 2, à monter sur une offre payante).
- **Le profil de marque vit dans `localStorage`**, via `useSyncExternalStore` — pas de
  `setState` dans un effet, la règle ESLint `react-hooks/set-state-in-effect` l'interdit.

## Contraintes de rédaction de l'agent

Le prompt système (`src/lib/agent.ts`) interdit d'inventer chiffres, prix, dates,
témoignages ou récompenses : ils sortent en `[à confirmer]`. Ne pas assouplir cette
règle — c'est ce qui rend le résultat publiable sans relecture factuelle.

Les contraintes par réseau vivent dans `src/lib/networks.ts` (limites de caractères,
hashtags, règles éditoriales). Toute nouvelle plateforme s'ajoute là, et le prompt
la reprend automatiquement via `networkBriefing()`.

## Outillage disponible

Agents (`.claude/agents/`) :

| Agent | Quand |
|---|---|
| `design-lead` | direction visuelle, layout, densité, critique d'écran |
| `nextjs-engineer` | routes, composants, streaming, schémas |
| `cm-editorial-reviewer` | qualité rédactionnelle des posts produits |
| `social-api-integrator` | phase 2 : publication automatique, OAuth, files d'attente |

Skills (`.claude/skills/`) : `frontend-design` et `ui-ux-pro-max` pour le design
(la seconde s'interroge en ligne de commande, voir `design-lead`), `design-brief`,
et `nouveau-reseau` pour ajouter une plateforme.

MCP (`.mcp.json`) : Playwright, pour regarder l'interface réellement rendue.

## Vérification

```bash
npm run build          # inclut le typecheck et génère .next/types
npm run lint
npm run test:agent     # appelle réellement les deux routes et contrôle les sorties
```

`npm run typecheck` seul échoue sur `LayoutProps` tant que `next build` n'a pas généré
`.next/types` — lance un build d'abord sur un dépôt fraîchement cloné.

Pour tester les routes sans passer par l'interface, poster un JSON conforme à
`generateRequestSchema` sur `/api/generate`. Attention : en cas d'échec modèle, la route
renvoie **200 avec un corps vide** — le statut HTTP est déjà parti quand l'erreur
survient. La cause réelle est dans le terminal du serveur, préfixée `[cm/generate]`.
