import {
  streamCampaign,
  streamCampaignSingleCall,
  isSingleCallMode,
} from "@/lib/generate-campaign";
import { estimateCampaignCost, getQuota } from "@/lib/quota";
import { generateRequestSchema } from "@/lib/schema";
import { getViewer } from "@/lib/session";

export const maxDuration = 300;

export async function POST(req: Request) {
  // L'authentification passe avant la validation : inutile de valider une
  // requête qu'on refusera de toute façon.
  const viewer = await getViewer();
  if (!viewer) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = generateRequestSchema.safeParse(await req.json());

  if (!parsed.success) {
    return Response.json(
      { error: "Requête invalide", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  /**
   * Le quota est appliqué ici, jamais côté client.
   *
   * Une campagne coûte jusqu'à 7 appels modèle payés par notre clé. Un contrôle
   * qui vivrait dans le navigateur se contournerait avec une requête directe.
   */
  const quota = await getQuota(viewer.organizationId);
  const cost = estimateCampaignCost(parsed.data.networks.length);

  if (cost > quota.remaining) {
    return Response.json(
      {
        error: "Crédits insuffisants",
        cost,
        remaining: quota.remaining,
        resetsOn: quota.resetsOn,
      },
      { status: 402 },
    );
  }

  const input = {
    ...parsed.data,
    organizationId: viewer.organizationId,
    userId: viewer.userId,
  };

  if (isSingleCallMode()) {
    return streamCampaignSingleCall(input);
  }

  return new Response(streamCampaign(input).pipeThrough(new TextEncoderStream()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
