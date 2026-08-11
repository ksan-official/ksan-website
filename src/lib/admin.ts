import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

export async function requireAdmin(accessToken: string | null) {
  if (!accessToken) {
    return { ok: false as const, error: "Missing access token." };
  }

  const authClient = createServerSupabaseClient(accessToken);
  const { data: userData, error: userError } = await authClient.auth.getUser();

  if (userError || !userData.user) {
    return { ok: false as const, error: "Invalid session." };
  }

  const serviceClient = createServiceSupabaseClient();
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { ok: false as const, error: "Admin access required." };
  }

  return { ok: true as const, userId: userData.user.id, serviceClient };
}
