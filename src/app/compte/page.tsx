import { AccountPanel } from "@/components/account-panel";
import { getQuota } from "@/lib/quota";
import { requireViewer } from "@/lib/session";

export default async function ComptePage() {
  const viewer = await requireViewer();
  const quota = await getQuota(viewer.organizationId);

  return <AccountPanel viewer={viewer} quota={quota} />;
}
