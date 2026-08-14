# Feuille de route produit

Établie le 13 août 2026, après analyse comparative avec Buffer, Metricool, Later,
Agorapulse, Predis.ai et Ocoya.

Le chantier en cours — l'authentification — a son propre document : `taches.md`.

Règle de lecture : une tâche n'entre en phase que si elle débloque la suivante. On ne
construit pas une fonction parce qu'elle est amusante, mais parce que son absence empêche
quelqu'un d'utiliser l'outil deux fois.

---

## État actuel — ce qui fonctionne

- [x] Génération adaptée à 6 réseaux, en deux temps (brief puis un appel par réseau)
- [x] Contraintes mesurables vérifiées **par le code**, avec passe de réparation ciblée
- [x] Interdiction d'inventer chiffres, prix, dates, témoignages → `[à confirmer]`
- [x] Voix de marque apprise sur de vraies publications collées par l'utilisateur
- [x] 3 accroches proposées par post, au choix
- [x] Scripts vidéo pour TikTok et YouTube
- [x] Brief visuel par post
- [x] Agent de réponse : sentiment, intention, priorité, escalade, public/privé
- [x] Interface claire, thème clair, shadcn/ui, animations au défilement
- [x] 51 contrôles automatiques (`npm run test:agent`)
- [x] Déployé en production

## Les deux manques éliminatoires

Aujourd'hui l'outil est **mono-utilisateur et mono-client**. C'est-à-dire : fait pour son
auteur, et pour personne d'autre.

- ❌ **Rien n'est sauvegardé.** On génère, on copie, tout disparaît au rechargement.
- ❌ **Un seul profil de marque**, stocké dans le navigateur.

Un community manager freelance gère 5 à 20 clients. Ces deux manques lui rendent l'outil
inutilisable, quelle que soit la qualité de la rédaction.

---

## Le point qui peut invalider le plan commercial

- [ ] **Peut-on encaisser en Mobile Money (MTN MoMo, Orange Money) ?**

Stripe gère mal le Mobile Money au Cameroun. Or l'avantage concurrentiel identifié est
justement le prix local et le paiement local. Si l'encaissement local est impossible, le
positionnement s'effondre — pour une raison commerciale, pas technique.

**Cela se vérifie en quelques appels, pas en développant.**

---

## Phase A — le socle multi-utilisateurs 🔴

Sans elle, rien d'autre n'a de sens. Peu spectaculaire, et c'est exactement pour ça qu'elle
est prioritaire : personne ne veut coder la sauvegarde, mais c'est son absence qui fait
qu'un utilisateur essaie une fois et ne revient jamais.

- [ ] Provisionner Neon Postgres, brancher Drizzle
- [ ] Schéma : `organisation → marque → campagne → post`, plus une table `utilisation`
- [ ] Authentification Better Auth — périmètre détaillé dans `taches.md`
- [ ] **Profils de marque multiples** — créer, renommer, basculer de l'un à l'autre
- [ ] **Historique des campagnes** — retrouver, rouvrir, dupliquer
- [ ] Migration du profil actuel depuis `localStorage` vers la base
- [ ] Suppression d'une campagne et d'un profil

### Les deux points non négociables de cette phase

- [ ] **Isolation par organisation.** Chaque requête filtrée par propriétaire, sans
      exception. Une seule requête oubliée et un client voit les campagnes d'un autre.
      C'est le bug classique du SaaS multi-client, et il est éliminatoire.
- [ ] **Quota appliqué côté serveur.** Une campagne coûte 7 appels modèle payés par
      *notre* clé. Sans quota, un utilisateur en essai gratuit peut générer une facture
      réelle. Ce n'est pas une fonction de confort, c'est une protection financière.

Ces deux points prolongent le risque accepté dans `docs/securite.md` : « API publique sans
authentification ni limitation de débit ». La phase A est le moment où ce risque est levé.

## Phase B — le flux de travail réel 🟠

- [ ] **Export d'une campagne** (Markdown, PDF ou lien partageable)
- [ ] **Lien de validation client** — le client relit et approuve avant publication
- [ ] **Vue calendrier** — voir le mois, déplacer un post à une date
- [ ] Édition manuelle d'un post généré, et sauvegarde de la version corrigée
- [ ] Régénérer un seul réseau sans relancer toute la campagne

## Phase B bis — facturation 🟠

À traiter seulement une fois que des gens utilisent vraiment les phases A et B. Faire payer
un produit dont personne ne se sert est le meilleur moyen de conclure à tort qu'il
n'intéresse personne.

- [ ] Définir les paliers à partir du coût réel mesuré
- [ ] Choisir le canal d'encaissement selon la réponse Mobile Money
- [ ] Relier le quota au palier souscrit
- [ ] Page de facturation et historique des paiements

## Phase C — publication 🟠

Documentée dans `docs/publication-automatique.md`. Ne pas démarrer avant que des
utilisateurs se servent réellement des phases A et B.

- [ ] Trancher : agrégateur (Postiz, Mixpost) ou intégrations directes
- [ ] Connexion des comptes sociaux (OAuth, jetons jamais côté client)
- [ ] File d'attente de publication, idempotente
- [ ] Programmation à date et heure
- [ ] Affichage explicite des échecs de publication

Pièges connus : jetons Meta expirant à 60 jours sans renouvellement automatique ; posts
TikTok forcés en privé tant que l'audit n'est pas passé.

## Phase D — mesure 🟡

Impossible avant la phase C : il faut les jetons des comptes pour lire les statistiques.

- [ ] Récupération des performances par post
- [ ] Tableau de bord par marque
- [ ] Rapport mensuel exportable

---

## Fonctions possibles avec le code existant

Classées par rapport effort/valeur. Toutes réutilisent des briques déjà écrites.

| Fonction | Effort | Ce qu'elle réutilise |
|---|---|---|
| **Régénérer un seul réseau** | ⚡ très faible | Le pipeline génère déjà chaque réseau séparément. Divise la consommation de quota par six |
| **Atomisation d'un texte long** | 🔨 faible | L'étape de brief extrait déjà les faits d'un texte. Coller un article ou un communiqué → la campagne complète. **Le vrai usage métier** : un CM part rarement d'une page blanche |
| **Réponses en lot** | 🔨 moyen | Le schéma de tri existe, il faut boucler dessus. Un CM ouvre son téléphone avec 30 commentaires, pas un seul |
| **Critiquer un post existant** | ⚡ très faible | `findViolations()` appelé sur une entrée au lieu d'une sortie |
| **Ajouter un réseau après coup** | ⚡ très faible | Même mécanique que la régénération |
| **Calendrier éditorial** | 🔨🔨 moyen | Logique de brief, à partir de piliers de contenu |
| **Guide de voix de marque** | 🔨 faible | Les exemples collés servent déjà implicitement |
| **Déclinaison multilingue** | 🔨 faible | Le champ `language` existe déjà |
| **Brief visuel → image** | 🔨🔨🔨 élevé | Demande un modèle d'image, coût supplémentaire par génération |

Les trois premières valent probablement plus, pour un utilisateur, que toute la phase
authentification. À garder en tête au moment d'arbitrer.

---

## Ce qu'on ne construit pas, et pourquoi

| Fonction | Raison |
|---|---|
| Link-in-bio | Hors sujet, marché saturé et gratuit |
| Rapports en marque blanche | Fonction de maturité, aucun client ne l'a demandée |
| Bibliothèque de médias | Canva et Google Drive le font déjà mieux |
| Suggestions de hashtags tendance | Gadget ; les hashtags ne portent plus la portée |

---

## Le positionnement à garder en tête

Le découpage actuel du marché :

- **Buffer, Later, Metricool** → publier et programmer. Faibles en rédaction, absents sur
  les commentaires.
- **Agorapulse, Sprout Social** → gérer la communauté. Excellents mais chers.
- **Predis.ai, Ocoya** → générer du contenu. Rien sur la communauté.

**Personne ne fait bien « écrire + répondre » à petit prix.** C'est le quotidien réel d'un
community manager : produire le matin, gérer les commentaires l'après-midi. Les deux
moitiés existent déjà ici — c'est l'angle le plus défendable, bien plus que « encore un
générateur de posts ».

Second angle : les outils mondiaux sont pensés en anglais, facturés en dollars, payables
par carte internationale. Un outil **en français, au prix local, payable en Mobile Money**
répond à un besoin que personne ne couvre.
