import { Workspace } from "@/components/workspace";
import { listBrands } from "@/lib/brands";
import { getQuota } from "@/lib/quota";
import { requireViewer } from "@/lib/session";

/**
 * Composant serveur : il charge ce qui appartient à l'organisation de
 * l'appelant, puis passe le résultat à l'interface. Le client ne choisit jamais
 * quelle organisation lire — il reçoit ce à quoi il a droit.
 */
export default async function Home() {
  const viewer = await requireViewer();
  const [brands, quota] = await Promise.all([
    listBrands(),
    getQuota(viewer.organizationId),
  ]);

  return <Workspace viewer={viewer} brands={brands} quota={quota} />;
}
