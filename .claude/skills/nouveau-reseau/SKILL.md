---
name: nouveau-reseau
description: Ajouter un réseau social à l'agent community manager (Threads, Pinterest, Snapchat, Mastodon…). Couvre les contraintes éditoriales, le schéma, l'interface et la vérification. À utiliser dès que l'utilisateur demande de supporter une plateforme qui n'est pas dans les six actuelles.
---

# Ajouter un réseau

L'application est conçue pour que l'ajout d'un réseau se fasse **en un seul endroit**.
Si tu te retrouves à modifier un prompt en dur, tu t'es trompé de chemin.

## 1. Décrire le réseau

Tout part de `src/lib/networks.ts`. Ajoute l'identifiant à `NETWORK_IDS`, puis une entrée
dans `NETWORKS` :

- `maxChars` — la vraie limite de la plateforme, vérifiée dans sa documentation actuelle,
  pas de mémoire. Elles changent.
- `sweetSpot` — la longueur qui performe, différente de la limite. C'est ce que l'agent vise.
- `hashtags` — combien, et où les placer.
- `video` — `true` déclenche la demande d'un script vidéo.
- `needsTitle` — `true` déclenche la demande d'un titre (cas YouTube).
- `accent` — un dégradé Tailwind qui rende le réseau identifiable dans une grille.
  Vérifie le contraste du texte blanc par-dessus.
- `rules` — le cœur du travail. Écris les règles éditoriales **réelles** de la plateforme :
  ce qui est visible avant la coupure, si les liens sont cliquables, le registre de langue
  attendu, les usages qui font échouer un post. Sois précis et impératif : ces lignes
  partent telles quelles dans le prompt via `networkBriefing()`.

Le schéma Zod (`src/lib/schema.ts`) dérive automatiquement de `NETWORK_IDS` — rien à y
modifier. L'interface itère sur `NETWORK_LIST` — rien à y modifier non plus.

## 2. Étendre la vérification

Dans `scripts/test-agent.mjs`, ajoute le réseau à l'objet `LIMITS` avec sa limite réelle.
Le test contrôlera alors sa présence, sa longueur et, s'il est vidéo, son script.

## 3. Vérifier pour de vrai

```bash
npm run dev
npm run test:agent
```

Puis **lis le post produit pour ce réseau**. Le test prouve que les contraintes
mécaniques sont respectées ; il ne dit rien de la qualité éditoriale. Si le texte
ressemble à celui d'un autre réseau, les `rules` sont trop vagues — c'est là qu'il faut
revenir, pas dans le prompt système.

## Pièges

- **Ne touche pas à `CM_SYSTEM_PROMPT`** pour un réseau donné. Il porte les règles
  transversales (pas d'invention de faits, pas de langue de bois) ; les spécificités
  d'une plateforme vivent dans ses `rules`.
- **Une limite de caractères stricte doit être écrite en majuscules dans les règles.**
  Le modèle traite « LIMITE STRICTE : jamais plus de 280 caractères » nettement mieux
  qu'une mention en passant. Voir l'entrée `x` comme modèle.
- **Un réseau vidéo sans `video: true`** produira un post sans script, et le test le
  signalera. Ne corrige pas le test : corrige la déclaration.
