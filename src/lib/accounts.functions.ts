import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { emailForUsername, SEED_ACCOUNTS } from "./accounts";

type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

async function findUserIdByEmail(admin: AdminClient, email: string): Promise<string | null> {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

/** Creates the three fixed accounts if they do not exist yet. Idempotent. */
export const ensureSeedAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (const acc of SEED_ACCOUNTS) {
    const email = emailForUsername(acc.username);
    let userId = await findUserIdByEmail(supabaseAdmin, email);
    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: acc.password,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      userId = data.user?.id ?? null;
    }
    if (!userId) continue;
    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: userId, username: acc.username, name: acc.name, location: acc.location },
        { onConflict: "id" },
      );
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: acc.role }, { onConflict: "user_id,role" });
  }
  return { ok: true };
});

async function assertEngineer(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "engineer",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const techInput = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
  name: z.string().min(1),
  location: z.string().default(""),
  phone: z.string().optional(),
});

export const createTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => techInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertEngineer(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const username = data.username.trim().toLowerCase();
    const { data: taken } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (taken) throw new Error("USERNAME_TAKEN");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailForUsername(username),
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    const userId = created.user!.id;

    const { error: pErr } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      username,
      name: data.name.trim(),
      location: data.location.trim(),
      phone: data.phone?.trim() || null,
    });
    if (pErr) throw new Error(pErr.message);

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "technician" });
    if (rErr) throw new Error(rErr.message);

    return { id: userId };
  });

export const updateTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1),
        location: z.string().default(""),
        phone: z.string().optional(),
        password: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertEngineer(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        name: data.name.trim(),
        location: data.location.trim(),
        phone: data.phone?.trim() || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.password && data.password.trim().length >= 4) {
      const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.password.trim(),
      });
      if (aErr) throw new Error(aErr.message);
    }
    return { ok: true };
  });

export const deleteTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertEngineer(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    await supabaseAdmin.from("profiles").delete().eq("id", data.id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
