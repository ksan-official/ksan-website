import { getOptionalEnv } from "@/lib/env";

type SheetPayload = {
  type: "business_application" | "event_registration";
  submittedAt: string;
  values: Record<string, string | null>;
};

export async function appendToGoogleSheet(payload: SheetPayload) {
  const webhookUrl = getOptionalEnv("GOOGLE_APPS_SCRIPT_WEBHOOK_URL");
  const secret = getOptionalEnv("GOOGLE_APPS_SCRIPT_SHARED_SECRET");

  if (!webhookUrl) {
    return { skipped: true, ok: false, reason: "GOOGLE_APPS_SCRIPT_WEBHOOK_URL is not configured." };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-KSAN-Webhook-Secret": secret } : {})
    },
    body: JSON.stringify(payload)
  });

  return {
    skipped: false,
    ok: response.ok,
    status: response.status,
    body: await response.text()
  };
}
