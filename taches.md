# Tâches — authentification

Périmètre décidé le 13 août 2026. C'est le premier chantier du passage en SaaS.

La feuille de route générale du produit est dans `docs/feuille-de-route.md`.

---

## Pile technique

| Choix | Décision | Raison |
|---|---|---|
| Base de données | Neon Postgres (Marketplace Vercel) | Conçue pour le serverless, provisionnée en 2 min |
| ORM | Drizzle | Le schéma **est** du TypeScript : une colonne ajoutée met les types à jour immédiatement, sans étape de génération. Prisma impose `prisma generate` en plus de la migration, et c'est celle-là qu'on oublie |
| Authentification | Better Auth | Les utilisateurs vivent dans **notre** Postgres, reliés aux marques par une vraie clé étrangère. Aucun coût par utilisateur : un tarif en dollars indexé sur les utilisateurs actifs érode la marge d'un produit vendu en francs CFA |
| Envoi d'e-mails | Resend | Corollaire : Better Auth déclenche, c'est nous qui envoyons vérifications et réinitialisations |

Clerk avait été envisagé pour sa rapidité de mise en route. Deux critères l'emportent sur
la durée : les utilisateurs hors de notre base, et la facturation par utilisateur actif en
devise forte.

### Versions vérifiées le 13 août 2026

| Paquet | Version à installer |
|---|---|
| `better-auth` | 1.6.28 |
| `@better-auth/drizzle-adapter` | 1.6.28 |
| `drizzle-orm` | **0.45.2** — `latest`, **surtout pas** `@rc` |
| `drizzle-kit` | 0.31.10 |
| `@neondatabase/serverless` | 1.1.0 |
| `resend` | 6.20.0 |

**Le piège à ne pas retomber dedans.** La page « Get started » de Drizzle recommande
`drizzle-orm@rc`, qui vaut aujourd'hui `1.0.0-rc.4`. Or `@better-auth/drizzle-adapter`
exige `drizzle-orm: ^0.45.2`. Suivre la documentation officielle de Drizzle casse donc
l'authentification. **La contrainte de Better Auth prime sur la doc de Drizzle** tant que
l'adaptateur n'a pas migré vers la 1.0.

Better Auth déclare explicitement `next: ^16.0.0` et `react: ^19` dans ses dépendances de
pairs : notre version de Next est officiellement supportée.

### Modalités d'intégration confirmées

- Route d'auth : `src/app/api/auth/[...all]/route.ts` via `toNextJsHandler(auth)`
- Client : `createAuthClient` depuis `better-auth/react`
- Session serveur : `auth.api.getSession({ headers: await headers() })`
- **Next 16 : `proxy.ts`**, pas `middleware.ts`
- Drizzle sur Neon : `drizzle-orm/neon-http` + client `neon()`, connexion HTTP

### Points tranchés par la reconnaissance du 13 août 2026

**Génération du schéma : `npx auth@latest generate`.** Ce n'est pas une coquille de la
doc. Le paquet npm `auth` a été repris par l'auteur de Better Auth et suit la version du
cœur. `@better-auth/cli` est l'**ancien** paquet, figé en 1.4.21 : l'utiliser générerait
un schéma en retard.

**Les greffons `admin` et `organization` sont dans le paquet principal**, importés depuis
`better-auth/plugins` (et `better-auth/client/plugins` côté client). Aucun paquet séparé.

**La limitation de débit doit utiliser `storage: "database"`.** Par défaut elle stocke en
mémoire, ce qui ne protège rien sur Vercel où chaque requête peut atterrir sur une
instance différente.

**`requireEmailVerification` est inopérant sans `sendVerificationEmail`.** Les deux vont
ensemble, sinon la vérification ne s'applique pas.

**Ne pas `await` l'envoi d'e-mail** (la doc l'indique explicitement, contre les attaques
temporelles). Sur Vercel, envelopper dans `waitUntil()` de `@vercel/functions` plutôt que
de laisser l'appel nu, sinon la fonction peut être gelée avant l'envoi.

### Le blocage Resend, et son contournement

**Sans domaine vérifié, Resend n'envoie que vers l'adresse du propriétaire du compte** ;
tout autre destinataire renvoie 403. La vérification d'e-mail obligatoire rendrait donc
l'inscription impossible pour tout le monde sauf nous.

`cm-taupe-eight.vercel.app` étant un sous-domaine Vercel, aucun enregistrement DNS n'y est
possible : **il faut acheter un vrai nom de domaine** — nécessaire de toute façon pour un
SaaS.

Contournement retenu en attendant :

| Environnement | Comportement |
|---|---|
| Développement | Le lien de vérification s'affiche dans le terminal, aucun e-mail envoyé |
| Production | Envoi réel via Resend, une fois le domaine vérifié |

Palier gratuit Resend : 3 000 e-mails/mois, 100/jour, 1 domaine.

- [ ] Acheter un nom de domaine
- [ ] Le vérifier chez Resend (SPF, DKIM, puis DMARC en `p=none`)
- [ ] Tester la réception vers Gmail **et** Outlook avant d'ouvrir les inscriptions

---

## v1 — indispensable

- [ ] E-mail + mot de passe
- [ ] Connexion Google
- [ ] **Vérification d'e-mail obligatoire** — ce n'est pas de l'hygiène, c'est le verrou
      qui empêche de créer 50 comptes jetables et de consommer 50 fois le quota gratuit,
      payé par notre clé API
- [ ] Réinitialisation du mot de passe
- [ ] Limitation de débit sur les routes d'authentification
- [ ] Module d'administration — consulter les comptes, voir la consommation, suspendre
- [ ] Import du profil `localStorage` existant au moment de l'inscription
- [ ] **Suppression de compte professionnelle** : export préalable des données, suppression
      douce avec 30 jours de grâce, purge réelle ensuite, conservation du légalement
      obligatoire. Petit à coder maintenant, pénible à rattraper sur une base pleine.

## La décision structurante : modéliser les organisations dès le départ

Les marques appartiennent à une **organisation**, jamais directement à un utilisateur.
Un compte solo est simplement une organisation d'une personne.

Raison : si les marques appartiennent à un utilisateur et qu'une agence veut plus tard
partager ses marques entre trois collaborateurs, il faut migrer la propriété de *chaque*
table sur des données réelles. En modélisant l'organisation maintenant, l'ajout des
invitations devient une simple fonction d'interface.

**Coût aujourd'hui : quasi nul. Coût du rattrapage : élevé.**

## Ce que l'authentification débloque, propre à cette application

Ces fonctions n'auraient aucun sens sur un autre produit. Elles existent parce que générer
coûte de l'argent, et parce qu'un CM travaille pour des clients qui relisent.

- [ ] **Quota par compte, visible et opposable.** « 12 campagnes restantes ce mois »
      affiché en permanence, blocage propre avec message clair quand c'est épuisé — pas
      une erreur technique. Le compteur doit refléter le coût réel : une campagne 6
      réseaux consomme 7 appels, une campagne 2 réseaux en consomme 3.
- [ ] **Lien de validation client, sans compte.** Le client d'un CM freelance ne créera
      jamais de compte ici. Il faut un lien signé, à durée limitée, en lecture seule sur
      une campagne. C'est de l'authentification par jeton, sans session ni inscription.
      Besoin le plus cité par les freelances.
- [ ] **Apporter sa propre clé API.** L'utilisateur fournit sa clé Google : son quota
      devient illimité et il ne nous coûte plus rien. Peut devenir une offre tarifaire.
      Contrainte : clé **chiffrée en base**, jamais lisible en clair, jamais renvoyée au
      client.
- [ ] **Support par substitution.** Se mettre à la place d'un utilisateur pour
      diagnostiquer. Sur un SaaS tenu par une personne, c'est ce qui rend le support
      possible.
- [ ] **Accueil guidé après inscription.** Un profil de marque vide produit une mauvaise
      première génération, et une mauvaise première génération ne donne pas de deuxième
      essai. L'inscription doit enchaîner sur le remplissage du profil, en insistant sur le
      champ « publications existantes », celui qui améliore le plus le résultat.

## v2 — sur demande réelle

- [ ] Interface des organisations : invitations, rôles, permissions
- [ ] Double authentification
- [ ] Passkeys

## v3 — dépend d'autres décisions

- [ ] Abonnement — greffon `@better-auth/stripe` disponible, mais le choix dépend de la
      réponse sur le paiement Mobile Money
- [ ] Connexion par SMS — chaque envoi est facturé. À chiffrer avant d'activer : sur un
      produit vendu quelques milliers de FCFA par mois, cela pèse sur la marge

---

## Ce qu'on ne construit pas côté authentification

| Fonction | Raison |
|---|---|
| Rôles fins (éditeur, relecteur, admin) | Prématuré tant qu'il n'y a pas d'équipes |
| SSO d'entreprise, SCIM | La cible est le freelance et la petite agence |
| Sessions multiples | Un CM travaille sur un ou deux appareils, pas dix |
| Connexion GitHub | Le public n'est pas développeur |
| Lien magique par e-mail | Dépend entièrement de la délivrabilité, risqué |

## Le piège à ne pas confondre

« Se connecter avec Facebook » et « connecter la page Facebook d'un client pour y
publier » sont **deux choses différentes** : autorisations, flux et validation par Meta
distincts. La première est triviale, la seconde relève de la publication automatique et
demande une revue d'application (voir `docs/publication-automatique.md`).

Pour l'inscription, **Google suffit**. Ajouter Facebook ou LinkedIn n'apporte presque rien
et crée de la confusion avec la connexion des comptes à gérer.

---

## Question ouverte qui bloque le schéma

**Comment se compte le quota ?**

| Modèle | Avantage | Inconvénient |
|---|---|---|
| Mensuel — 30 campagnes/mois | Simple à comprendre | Ne reflète pas le coût réel |
| Journalier — 3 campagnes/jour | Lisse la charge | Frustrant, on ne rattrape pas |
| **Crédits** — 1 crédit par réseau | Honnête, souple, rechargeable | Demande une explication |

Recommandation : les **crédits**. Le coût réel est par réseau, pas par campagne — une
campagne 6 réseaux coûte trois fois plus qu'une campagne 2 réseaux. Un compteur en crédits
dit la vérité et permet de vendre des recharges sans changer d'abonnement.

Le modèle mensuel obligerait à tarifer sur le pire cas, donc à faire payer trop cher ceux
qui ne publient que sur deux réseaux.

## Ampleur réelle

Le périmètre v1 seul représente plusieurs jours. L'ensemble v1 + v2 + v3 se compte en
semaines, pas en jours.
