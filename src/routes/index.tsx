import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  statusFromMaintenance,
  store,
  todayKey,
  type Generator,
  type Report,
  type User,
} from "@/lib/genstore";
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
  const [users, setUsersState] = useState<User[]>([]);
  const [generators, setGeneratorsState] = useState<Generator[]>([]);
  const [reports, setReportsState] = useState<Report[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    setUsersState(store.getUsers());
    setGeneratorsState(store.getGenerators());
    setReportsState(store.getReports());
    setCurrentId(store.getSession());
    setReady(true);
  }, []);

  const setUsers = (u: User[]) => {
    setUsersState(u);
    store.setUsers(u);
  };
  const setGenerators = (g: Generator[]) => {
    setGeneratorsState(g);
    store.setGenerators(g);
  };

  const handleLogin = (username: string, password: string) => {
    const list = store.getUsers();
    setUsersState(list);
    const found = list.find((u) => u.username === username && u.password === password);
    if (!found) return "اسم المستخدم أو كلمة المرور غير صحيحة.";
    setCurrentId(found.id);
    store.setSession(found.id);
    return null;
  };

  const handleLogout = () => {
    setCurrentId(null);
    store.setSession(null);
  };

  const submitReport = (report: Report) => {
    const others = reports.filter(
      (r) => !(r.generatorId === report.generatorId && r.date === todayKey()),
    );
    const next = [...others, { ...report, createdAt: new Date().toISOString() }];
    setReportsState(next);
    store.setReports(next);

    const status = statusFromMaintenance(report.maintenanceType);
    setGenerators(
      store.getGenerators().map((g) => (g.id === report.generatorId ? { ...g, status } : g)),
    );
  };

  if (!ready) return <div className="min-h-screen bg-background" />;

  const current = users.find((u) => u.id === currentId) ?? null;
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
