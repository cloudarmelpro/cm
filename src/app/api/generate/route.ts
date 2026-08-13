import {
  streamCampaign,
  streamCampaignSingleCall,
  isSingleCallMode,
} from "@/lib/generate-campaign";
import { generateRequestSchema } from "@/lib/schema";

export const maxDuration = 300;

export async function POST(req: Request) {
  const parsed = generateRequestSchema.safeParse(await req.json());

  if (!parsed.success) {
    return Response.json(
      { error: "Requête invalide", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (isSingleCallMode()) {
    return streamCampaignSingleCall(parsed.data);
  }

  return new Response(
    streamCampaign(parsed.data).pipeThrough(new TextEncoderStream()),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // Le flux est produit poste par poste : pas de mise en tampon.
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
