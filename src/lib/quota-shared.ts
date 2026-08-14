/**
 * Partie du quota utilisable des deux côtés.
 *
 * Ce fichier ne doit JAMAIS importer la base de données : il est chargé par des
 * composants clients, et un import de `@/db` y tirerait le pilote Postgres dans
 * le navigateur — ce qui échoue à la compilation sur `dns` et `fs`.
 */

export type QuotaState = {
  used: number;
  limit: number;
  remaining: number;
  resetsOn: Date;
};

/**
 * Coût prévisionnel d'une campagne : un appel de brief, plus un par réseau.
 * Les réparations éventuelles s'ajoutent en cours de route.
 */
export function estimateCampaignCost(networkCount: number): number {
  return 1 + networkCount;
}
