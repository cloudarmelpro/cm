---
name: design-brief
description: Transforme une demande vague en brief de design précis, prêt à passer à l'agent design-lead. Utiliser AVANT toute conception de page ou de section — quand la demande tient en une phrase du type « fais la page d'accueil », « refais le header », « il faut une section services ». Produit un brief structuré (mission, public, action visée, contenu réel, contraintes, anti-objectifs, critères de réussite) puis passe la main à design-lead.
---

# Design Brief

Un design raté vient presque toujours d'un brief flou, jamais d'un manque de talent.
« Fais-moi une belle page d'accueil » ne contient aucune décision : l'agent invente donc
les siennes, et sort le template par défaut. Ce skill produit la commande précise qui
manque — il ne conçoit rien lui-même.

**Ton rôle ici : intervieweur, pas designer.** Tu ne proposes ni palette, ni typo, ni
layout. Tu extrais l'information, tu combles les trous avec le contexte du projet, tu
écris le brief. `design-lead` conçoit ensuite.

## Méthode

### 1. Lire le contexte avant de demander quoi que ce soit

Charge `CLAUDE.md` et `ARCHITECTURE.md`, et regarde le code existant de la page ou des
pages voisines. **Toute question dont la réponse est déjà dans le dépôt est une question
de trop** — elle fait perdre du temps et donne l'impression que rien n'est lu.

Ce qui est déjà acquis pour ce projet, à ne jamais redemander :

- Site vitrine bilingue FR/EN, objectif = génération de leads (appels, RDV, ventes)
- Univers premium · moderne · corporate · technologique · luxe — **jamais bas prix**
- Couleur principale imposée : **le vert**
- Cible : PME québécoises de services extérieurs (1–20 employés)
- Émotions : confiance, sérieux, qualité, professionnalisme
- Le mouvement est un levier de conversion, sous `prefers-reduced-motion`
- Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · lucide-react (pas d'emoji-icônes)
- A11y non négociable : contraste ≥ 4.5:1, focus visibles, cibles ≥ 44px, responsive
- Nom d'entreprise, logo, coordonnées : **non arrêtés** → placeholders explicites

### 2. Poser au maximum 5 questions — seulement celles qui changent le design

Une bonne question est celle dont deux réponses différentes produiraient deux designs
différents. Si la réponse ne change rien, ne la pose pas. Regroupe-les en un seul
message, avec une valeur par défaut proposée pour chacune, pour que l'utilisateur puisse
répondre « ok par défaut » sans réfléchir.

Les axes qui méritent presque toujours une question :

| Axe | Pourquoi il change tout |
|---|---|
| **La mission unique** de la page | Une page qui rassure ne ressemble pas à une page qui convertit |
| **Le visiteur et son état d'esprit** | Il arrive d'une recherche Google, d'une pub, d'une recommandation ? |
| **L'action visée** | Appel, RDV Calendly, formulaire, WhatsApp — une seule priorité |
| **Le contenu réellement disponible** | Photos de chantier ? Textes ? Rien ? Ça décide de la mise en page |
| **Les références aimées / détestées** | La façon la plus rapide de cadrer un goût |

Si l'utilisateur répond « je ne sais pas », **tranche toi-même et annonce ton choix** —
un brief avec une hypothèse assumée vaut infiniment mieux qu'un brief vide.

### 3. Écrire le brief

Format imposé ci-dessous. Toute rubrique sans information réelle est marquée
`⚠️ À FOURNIR` — jamais comblée par une invention.

```markdown
# Brief — <page ou section>

## Mission
Une phrase. Le seul travail que cette page doit accomplir.

## Visiteur
Qui arrive ici, d'où, dans quel état d'esprit, et ce qu'il cherche à savoir
dans les 5 premières secondes.

## Action visée
Le geste unique que la page doit provoquer. S'il y en a un secondaire, dire
lequel et pourquoi il ne doit pas concurrencer le premier.

## Contenu disponible
Ce qui existe vraiment (textes, photos, chiffres). Ce qui manque et devient
un placeholder explicite. ⚠️ Ne rien inventer : ni nom, ni témoignage, ni
chiffre, ni logo client, ni coordonnée.

## Émotion
Ce que le visiteur doit ressentir, et ce qu'il ne doit surtout pas ressentir.

## Contraintes dures
Techniques, i18n, a11y, marque. Reprendre celles du projet + celles propres
à cette page.

## Anti-objectifs
Ce qu'on refuse explicitement. Rubrique obligatoire — c'est elle qui empêche
le template générique.

## Références
Ce qui plaît, ce qui déplaît, et pourquoi. « À éviter » est aussi utile que
« à viser ».

## Critères de réussite
Comment on jugera le résultat. Concret et vérifiable, pas « que ce soit beau ».

## Hors périmètre
Ce que ce lot ne traite pas, pour éviter la dérive.
```

### 4. Faire valider, puis passer la main

Montre le brief, demande confirmation en une ligne, puis lance `design-lead` avec le
brief complet en entrée. Ne commence jamais à concevoir toi-même.

## Ce qui distingue un bon brief

- **Concret plutôt qu'abstrait** — « le visiteur doit comprendre en 5 secondes qu'on fait
  de l'excavation résidentielle » bat « inspirer la confiance ».
- **Les anti-objectifs valent les objectifs.** Dire ce qu'on refuse cadre plus vite que
  décrire ce qu'on veut : c'est ce qui bloque le hero centré avec gros dégradé et les
  trois cartes à icônes que produit n'importe quel générateur.
- **Une seule action prioritaire.** Deux CTA de force égale = zéro conversion.
- **Le contenu réel dicte la mise en page**, jamais l'inverse. Concevoir une grille de
  photos avant de savoir s'il y a des photos, c'est se condamner à un placeholder définitif.
- **Des critères vérifiables.** « Le numéro de téléphone est atteignable en un geste sur
  mobile » se contrôle ; « ça fait premium » ne se contrôle pas.

## Anti-patterns

- Poser 15 questions : l'utilisateur décroche et répond au hasard.
- Poser une question dont la réponse est dans `CLAUDE.md`.
- Proposer une palette ou une typo — ce n'est pas ton rôle, c'est celui de `design-lead`.
- Rendre un brief avec des rubriques vides plutôt que des `⚠️ À FOURNIR` assumés.
- Inventer un nom d'entreprise, un témoignage, un chiffre ou une coordonnée pour
  « rendre le brief plus concret ».
- Écrire le brief puis coder soi-même sans passer par `design-lead`.
