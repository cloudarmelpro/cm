# Publier automatiquement : ce que ça implique réellement

Recherche menée le 12 août 2026, en vue de la phase 2 du projet (l'agent publie
lui-même au lieu de produire du texte à copier-coller).

## Résumé en une phrase

Chaque réseau exige une **validation manuelle de ton application** par la plateforme,
avec démonstration vidéo, entre **2 semaines et 4 mois** selon le réseau — sauf si on
passe par un agrégateur qui détient déjà ces validations.

## Réseau par réseau

### Instagram + Facebook (Meta)

Le plus lourd des trois blocs.

- **Prérequis de compte** : compte Facebook Business, Page Facebook liée, compte
  Instagram Professionnel (Business ou Creator), application développeur Meta.
  Un compte Instagram personnel ne peut pas être publié par API — conversion obligatoire.
- **Permissions** : `instagram_business_basic` et `instagram_business_content_publish`,
  chacune soumise à App Review séparément, avec screencast du parcours complet.
- **Délai** : 2 à 4 semaines par soumission.
- **Publication** : en deux appels — création d'un conteneur média sur `/{ig-user-id}/media`,
  puis publication via `/{ig-user-id}/media_publish`.
- **Piège des jetons** : jeton court = 1 heure, jeton long = 60 jours, **aucun ne se
  renouvelle seul**. Il faut coder la logique de rafraîchissement avant toute autre chose,
  sinon l'intégration meurt silencieusement au bout de deux mois.

### LinkedIn

Le plus fermé.

- **API** : Community Management API (texte, images, vidéos, carrousels, sondages sur
  les pages entreprise).
- **Prérequis** : entreprise enregistrée, Page vérifiée, revue en deux paliers
  (Development Tier puis Standard Tier), screencast par cas d'usage.
- **Non ouvert aux développeurs individuels.**
- **Délai** : 4 semaines dans le meilleur des cas, **4 mois en moyenne**.

### X (Twitter)

Le modèle a changé le 6 février 2026.

- **Le palier gratuit est supprimé** pour les nouveaux développeurs.
- **Tarification à l'usage** : 0,015 $ par post publié — mais **0,20 $ si le post
  contient un lien**. C'est le point à retenir : un community manager publie
  presque toujours des liens.
- Lecture : 0,005 $ par post lu, plafonné à 2 M/mois.
- Les anciens paliers (Basic 200 $/mois, Pro 5 000 $/mois) sont **fermés aux nouvelles
  inscriptions**. Enterprise démarre vers 42 000 $/mois.
- **Ordre de grandeur pour nous** : 30 posts avec lien par mois ≈ 6 $/mois.

### TikTok

- **API** : Content Posting API, mode Direct Post, scope `video.publish`.
- **Piège majeur** : tant que l'application n'a pas passé l'audit, **tout post publié est
  forcé en `SELF_ONLY`** — visible par le seul créateur. L'intégration semble marcher,
  mais personne ne voit rien.
- **Audit** : démo enregistrée du parcours complet, URL de politique de confidentialité,
  preuve que l'intégration vit dans un produit fini.
- On peut développer et démontrer le flux complet avant l'audit, avec un compte de test.

### YouTube

Le plus accessible des six.

- Quota par défaut : 10 000 unités/jour.
- **Bonne nouvelle** : `videos.insert` est passé d'environ 1 600 à environ **100 unités**
  le 4 décembre 2025. Les guides plus anciens qui parlent de 6 vidéos/jour sont périmés.
- Depuis le 1er juin 2026, les envois sont facturés sur un **compteur dédié** (~100 appels/jour)
  et ne concurrencent plus les lectures.
- Augmentation de quota : formulaire d'audit Google, de quelques semaines à plusieurs mois.

## Le raccourci : passer par un agrégateur

Un agrégateur détient déjà les applications validées auprès de chaque plateforme. On
branche nos comptes via son OAuth, et on publie par **une seule API**. Cela supprime
les cinq validations ci-dessus.

| Solution | Modèle | Coût |
|---|---|---|
| **Postiz** | Open source, auto-hébergeable | Gratuit en auto-hébergé ; cloud dès 29 $/mois (5 comptes, 400 posts) |
| **Mixpost** | Auto-hébergé | 299 $ une fois, sans abonnement |
| **Ayrshare** | SaaS établi | 149 $/mois pour 1 profil, 299 $ pour 10, 599 $ pour 30 |

Postiz couvre plus de 30 plateformes, contre 13 à 15 pour Ayrshare.

## Recommandation

**Phase 2a — Postiz auto-hébergé ou cloud à 29 $/mois.** On garde notre agent de
rédaction, on ajoute la publication et la programmation via une seule API. Délai de mise
en œuvre : quelques jours au lieu de plusieurs mois. C'est réversible : si le projet
grossit, on entame les validations en direct sans jeter le travail.

**À vérifier avant de s'engager** : les conditions d'utilisation de l'agrégateur retenu,
et qu'il couvre bien les six réseaux visés. Aucun de ces points n'a été testé — cette
note est de la recherche documentaire, pas une validation terrain.

## Ce que ça change dans notre code

La publication impose une infrastructure que le projet actuel n'a pas :

- une **base de données** (file d'attente des posts, statuts, comptes connectés) ;
- un **système de comptes** pour ne pas exposer les jetons OAuth côté client ;
- un **planificateur** — Vercel Cron ou Vercel Queues déclenchant la publication à l'heure dite ;
- un **stockage de médias** (Vercel Blob) pour les images et vidéos.

## Sources

- [Instagram API Integration Guide 2026 — Phyllo](https://www.getphyllo.com/post/instagram-api-integration-101-for-developers-of-the-creator-economy)
- [Instagram Graph API in 2026 — Netrows](https://www.netrows.com/blog/instagram-graph-api-guide-2026)
- [LinkedIn API Access in 2026 — Phyllo](https://www.getphyllo.com/post/linkedin-api-access-in-2026-partner-program-approval-timeline-alternatives)
- [Community Management Overview — Microsoft Learn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview?view=li-lms-2026-07)
- [X API Pricing in 2026 — Postproxy](https://postproxy.dev/blog/x-api-pricing-2026/)
- [X (Twitter) API in 2026 — SocialCrawl](https://www.socialcrawl.dev/blog/x-twitter-api-2026)
- [TikTok Content Posting API Overview — TikTok for Developers](https://developers.tiktok.com/doc/content-posting-api-reference-photo-post)
- [TikTok API Approval: Audit, Scopes, Rejections — bundle.social](https://bundle.social/blog/tiktok-api-approval)
- [YouTube API Quota Limits 2026 — Phyllo](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota)
- [YouTube Data API 2026 — SocialCrawl](https://www.socialcrawl.dev/blog/youtube-data-api-2026)
- [Best Social Media APIs 2026 — Upload-Post](https://www.upload-post.com/best-social-media-apis/)
- [Postiz vs Ayrshare](https://postiz.com/compare/postiz/ayrshare)
