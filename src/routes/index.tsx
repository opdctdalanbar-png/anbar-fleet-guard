import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { statusFromMaintenance, type Generator, type Report, type User } from "@/lib/genstore";
import { emailForUsername } from "@/lib/accounts";
import {
  createTechnician,
  deleteTechnician,
  ensureSeedAccounts,
  updateTechnician,
} from "@/lib/accounts.functions";
import {
  fetchGenerators,
  fetchMyAccount,
  fetchReports,
  fetchUsers,
  genToRow,
  persistPhotos,
  saveReport,
} from "@/lib/db";
import { Login } from "@/components/app/Login";
import { EngineerDashboard } from "@/components/app/EngineerDashboard";
import { AuditorView } from "@/components/app/AuditorView";
import { TechnicianView } from "@/components/app/TechnicianView";

const title = "وحدة المولدات — شركة توزيع المنتجات النفطية / فرع الأنبار";
const description =
  "منظومة إدارة ومتابعة المولدات لوحدة المولدات في شعبة الكهرباء - القسم الفني، فرع الأنبار: تقارير يومية، حالات الصيانة، وإدارة الفنيين.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState<User | null>(null);
  const [users, setUsersState] = useState<User[]>([]);
  const [generators, setGeneratorsState] = useState<Generator[]>([]);
  const [reports, setReportsState] = useState<Report[]>([]);
  const busy = useRef(false);

  const loadData = useCallback(async () => {
    const [u, g, r] = await Promise.all([fetchUsers(), fetchGenerators(), fetchReports()]);
    setUsersState(u);
    setGeneratorsState(g);
    setReportsState(r);
  }, []);

  const loadSession = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setCurrent(null);
      return;
    }
    const me = await fetchMyAccount(data.user.id);
    setCurrent(me);
    if (me) await loadData();
  }, [loadData]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await ensureSeedAccounts();
      } catch {
        /* accounts already exist */
      }
      if (!active) return;
      await loadSession();
      if (active) setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void loadSession();
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadSession]);

  // Live refresh so newly added accounts, generators and reports show up at once.
  useEffect(() => {
    if (!current) return;
    const channel = supabase
      .channel("opdc-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        if (!busy.current) void loadData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "generators" }, () => {
        if (!busy.current) void loadData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        if (!busy.current) void loadData();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [current, loadData]);

  const run = async (fn: () => Promise<void>) => {
    busy.current = true;
    try {
      await fn();
      await loadData();
    } catch (err) {
      console.error(err);
      await loadData();
    } finally {
      busy.current = false;
    }
  };

  const setGenerators = (next: Generator[]) => {
    setGeneratorsState(next);
    void run(async () => {
      const prevById = new Map(generators.map((g) => [g.id, g]));
      const nextById = new Map(next.map((g) => [g.id, g]));

      for (const g of next) {
        const prev = prevById.get(g.id);
        if (!prev) {
          const { error } = await supabase.from("generators").insert(genToRow(g));
          if (error) throw error;
        } else if (JSON.stringify(prev) !== JSON.stringify(g)) {
          const { error } = await supabase.from("generators").update(genToRow(g)).eq("id", g.id);
          if (error) throw error;
        }
      }
      for (const g of generators) {
        if (!nextById.has(g.id)) {
          const { error } = await supabase.from("generators").delete().eq("id", g.id);
          if (error) throw error;
        }
      }
    });
  };

  const setUsers = (next: User[]) => {
    setUsersState(next);
    void run(async () => {
      const prevById = new Map(users.map((u) => [u.id, u]));
      const nextById = new Map(next.map((u) => [u.id, u]));

      for (const u of next) {
        if (u.role !== "technician") continue;
        const prev = prevById.get(u.id);
        if (!prev) {
          await createTechnician({
            data: {
              username: u.username,
              password: u.password || "Tech#2026",
              name: u.name,
              location: u.location,
              phone: u.phone ?? "",
            },
          });
        } else if (
          prev.name !== u.name ||
          prev.location !== u.location ||
          (prev.phone ?? "") !== (u.phone ?? "") ||
          (u.password ?? "").length > 0
        ) {
          await updateTechnician({
            data: {
              id: u.id,
              name: u.name,
              location: u.location,
              phone: u.phone ?? "",
              password: u.password || undefined,
            },
          });
        }
      }
      for (const u of users) {
        if (u.role === "technician" && !nextById.has(u.id)) {
          await deleteTechnician({ data: { id: u.id } });
        }
      }
    });
  };

  const handleLogin = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailForUsername(username),
      password,
    });
    if (error) return "اسم المستخدم أو كلمة المرور غير صحيحة.";
    await loadSession();
    return null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrent(null);
    setUsersState([]);
    setGeneratorsState([]);
    setReportsState([]);
  };

  const submitReport = (report: Report) => {
    if (!current) return;
    void run(async () => {
      const paths = await persistPhotos(report.photos, current.id);
      await saveReport({ ...report, techId: current.id, techName: current.name }, paths);

      const status = statusFromMaintenance(report.maintenanceType);
      const patch: {
        status: string;
        last_oil_change?: string;
        last_filter_change?: string;
        last_battery_change?: string;
      } = { status };
      if (report.oilChangedOn) patch.last_oil_change = report.oilChangedOn;
      if (report.filterChangedOn) patch.last_filter_change = report.filterChangedOn;
      if (report.batteryChangedOn) patch.last_battery_change = report.batteryChangedOn;
      const { error } = await supabase
        .from("generators")
        .update(patch)
        .eq("id", report.generatorId);
      if (error) throw error;
    });
  };

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!current) return <Login onLogin={handleLogin} />;

  if (current.role === "engineer")
    return (
      <EngineerDashboard
        user={current}
        generators={generators}
        setGenerators={setGenerators}
        users={users}
        setUsers={setUsers}
        reports={reports}
        onLogout={handleLogout}
      />
    );

  if (current.role === "auditor")
    return (
      <AuditorView
        user={current}
        generators={generators}
        reports={reports}
        onLogout={handleLogout}
      />
    );

  return (
    <TechnicianView
      user={current}
      generators={generators}
      reports={reports}
      onSubmitReport={submitReport}
      onLogout={handleLogout}
    />
  );
}
