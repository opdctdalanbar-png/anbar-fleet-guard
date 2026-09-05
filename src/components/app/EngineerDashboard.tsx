import { useMemo, useState } from "react";
import {
  Gauge,
  CircleCheck,
  TriangleAlert,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  Users,
  X,
} from "lucide-react";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  uid,
  type GenStatus,
  type Generator,
  type Report,
  type User,
} from "@/lib/genstore";
import { Banner } from "./Banner";
import { StatCard } from "./StatCard";

type Props = {
  user: User;
  generators: Generator[];
  setGenerators: (g: Generator[]) => void;
  users: User[];
  setUsers: (u: User[]) => void;
  reports: Report[];
  onLogout: () => void;
};

type SortKey = "location" | "status";

const emptyGen = (): Generator => ({
  id: uid(),
  code: "",
  name: "",
  location: "",
  specificLocation: "",
  capacity: "",
  status: "working",
  createdAt: new Date().toISOString(),
});

const emptyTech = (): User => ({
  id: uid(),
  username: "",
  password: "",
  name: "",
  role: "technician",
  location: "",
  phone: "",
});

export function EngineerDashboard({
  user,
  generators,
  setGenerators,
  users,
  setUsers,
  reports,
  onLogout,
}: Props) {
  const [tab, setTab] = useState<"fleet" | "techs">("fleet");
  const [filter, setFilter] = useState<"all" | GenStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [genDraft, setGenDraft] = useState<Generator | null>(null);
  const [techDraft, setTechDraft] = useState<User | null>(null);
  const [techError, setTechError] = useState<string | null>(null);

  const technicians = users.filter((u) => u.role === "technician");

  const stats = useMemo(
    () => ({
      total: generators.length,
      active: generators.filter((g) => g.status === "working").length,
      maintenance: generators.filter((g) => g.status !== "working").length,
    }),
    [generators],
  );

  const visible = useMemo(() => {
    let list = generators.filter((g) => (filter === "all" ? true : g.status === filter));
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = sortKey === "location" ? a.location : STATUS_LABEL[a.status];
        const bv = sortKey === "location" ? b.location : STATUS_LABEL[b.status];
        return sortDir === "asc" ? av.localeCompare(bv, "ar") : bv.localeCompare(av, "ar");
      });
    }
    return list;
  }, [generators, filter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const saveGen = () => {
    if (!genDraft || !genDraft.code.trim() || !genDraft.location.trim()) return;
    const exists = generators.some((g) => g.id === genDraft.id);
    setGenerators(
      exists ? generators.map((g) => (g.id === genDraft.id ? genDraft : g)) : [...generators, genDraft],
    );
    setGenDraft(null);
  };

  const saveTech = () => {
    if (!techDraft) return;
    if (!techDraft.name.trim() || !techDraft.username.trim() || !techDraft.password.trim()) {
      setTechError("الرجاء إكمال الاسم واسم المستخدم وكلمة المرور.");
      return;
    }
    if (users.some((u) => u.username === techDraft.username.trim() && u.id !== techDraft.id)) {
      setTechError("اسم المستخدم مستخدم مسبقاً.");
      return;
    }
    const clean = { ...techDraft, username: techDraft.username.trim() };
    const exists = users.some((u) => u.id === clean.id);
    setUsers(exists ? users.map((u) => (u.id === clean.id ? clean : u)) : [...users, clean]);
    setTechDraft(null);
    setTechError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Banner userName={user.name} roleLabel="مهندس النظام (صلاحيات كاملة)" onLogout={onLogout} />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Gauge} label="مجموع المولدات" value={stats.total} tone="primary" />
          <StatCard icon={CircleCheck} label="قيد العمل" value={stats.active} tone="success" />
          <StatCard
            icon={TriangleAlert}
            label="تحت الصيانة"
            value={stats.maintenance}
            tone="warning"
          />
        </div>

        <div className="flex gap-2">
          <button
            className={tab === "fleet" ? "btn-primary" : "btn-soft"}
            onClick={() => setTab("fleet")}
          >
            <Gauge className="size-4" /> أسطول المولدات
          </button>
          <button
            className={tab === "techs" ? "btn-primary" : "btn-soft"}
            onClick={() => setTab("techs")}
          >
            <Users className="size-4" /> حسابات الفنيين
          </button>
        </div>

        {tab === "fleet" ? (
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-base font-bold">جدول المولدات</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="field w-auto"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as "all" | GenStatus)}
                >
                  <option value="all">الكل</option>
                  <option value="working">قيد العمل</option>
                  <option value="preventive">صيانة وقائية</option>
                  <option value="fault">عطل دائم / تحت الصيانة</option>
                </select>
                <button className="btn-primary" onClick={() => setGenDraft(emptyGen())}>
                  <Plus className="size-4" /> إضافة مولدة
                </button>
              </div>
            </div>

            {generators.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                لا توجد مولدات مسجلة. ابدأ بإضافة أول مولدة إلى الأسطول.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-secondary/70 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">الرمز</th>
                      <th className="px-4 py-3 font-semibold">اسم المولدة</th>
                      <th className="px-4 py-3 font-semibold">
                        <button
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("location")}
                        >
                          الموقع العام <ArrowUpDown className="size-3.5" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold">الموقع الخاص</th>
                      <th className="px-4 py-3 font-semibold">القدرة</th>
                      <th className="px-4 py-3 font-semibold">
                        <button
                          className="flex items-center gap-1"
                          onClick={() => toggleSort("status")}
                        >
                          الحالة <ArrowUpDown className="size-3.5" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-semibold">آخر تقرير</th>
                      <th className="px-4 py-3 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((g) => {
                      const last = reports
                        .filter((r) => r.generatorId === g.id)
                        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                      return (
                        <tr key={g.id} className="border-t border-border">
                          <td className="px-4 py-3 font-mono text-xs">{g.code}</td>
                          <td className="px-4 py-3 font-semibold">{g.name}</td>
                          <td className="px-4 py-3">{g.location}</td>
                          <td className="px-4 py-3">{g.specificLocation || "—"}</td>
                          <td className="px-4 py-3">{g.capacity || "—"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CLASS[g.status]}`}
                            >
                              {STATUS_LABEL[g.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {last ? `${last.date} — ${last.maintenanceType}` : "لا يوجد"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button className="btn-soft" onClick={() => setGenDraft(g)}>
                                <Pencil className="size-3.5" /> تعديل
                              </button>
                              <button
                                className="btn-soft text-destructive"
                                onClick={() =>
                                  setGenerators(generators.filter((x) => x.id !== g.id))
                                }
                              >
                                <Trash2 className="size-3.5" /> حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="text-base font-bold">حسابات الفنيين الميدانيين</h2>
              <button className="btn-primary" onClick={() => setTechDraft(emptyTech())}>
                <Plus className="size-4" /> إضافة فني
              </button>
            </div>
            {technicians.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                لا توجد حسابات فنيين بعد.
              </p>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {technicians.map((t) => (
                  <div key={t.id} className="rounded-xl border border-border bg-secondary/50 p-4">
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">الموقع: {t.location || "—"}</p>
                    <p className="text-xs text-muted-foreground">الهاتف: {t.phone || "—"}</p>
                    <p className="mt-2 font-mono text-xs">
                      {t.username} / {t.password}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button className="btn-soft" onClick={() => setTechDraft(t)}>
                        <Pencil className="size-3.5" /> تعديل
                      </button>
                      <button
                        className="btn-soft text-destructive"
                        onClick={() => setUsers(users.filter((u) => u.id !== t.id))}
                      >
                        <Trash2 className="size-3.5" /> حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {genDraft ? (
        <Modal title={generators.some((g) => g.id === genDraft.id) ? "تعديل مولدة" : "إضافة مولدة"} onClose={() => setGenDraft(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="رمز المولدة">
              <input
                type="text"
                className="field"
                value={genDraft.code}
                onChange={(e) => setGenDraft({ ...genDraft, code: e.target.value })}
              />
            </Field>
            <Field label="اسم / نوع المولدة">
              <input
                type="text"
                className="field"
                value={genDraft.name}
                onChange={(e) => setGenDraft({ ...genDraft, name: e.target.value })}
              />
            </Field>
            <Field label="الموقع العام (إدخال حر)">
              <input
                type="text"
                className="field"
                placeholder="مثال: شعبة هيت، شعبة القائم"
                value={genDraft.location}
                onChange={(e) => setGenDraft({ ...genDraft, location: e.target.value })}
              />
            </Field>
            <Field label="الموقع الخاص (إدخال حر)">
              <input
                type="text"
                className="field"
                placeholder="مثال: محطة هيت، مستودع الرمادي"
                value={genDraft.specificLocation}
                onChange={(e) => setGenDraft({ ...genDraft, specificLocation: e.target.value })}
              />
            </Field>
            <Field label="القدرة (KVA)">
              <input
                type="text"
                className="field"
                value={genDraft.capacity}
                onChange={(e) => setGenDraft({ ...genDraft, capacity: e.target.value })}
              />
            </Field>
            <Field label="الحالة">
              <select
                className="field"
                value={genDraft.status}
                onChange={(e) => setGenDraft({ ...genDraft, status: e.target.value as GenStatus })}
              >
                <option value="working">قيد العمل</option>
                <option value="preventive">صيانة وقائية</option>
                <option value="fault">عطل دائم / طارئ</option>
              </select>
            </Field>
          </div>
          <button className="btn-primary mt-5 w-full" onClick={saveGen}>
            حفظ
          </button>
        </Modal>
      ) : null}

      {techDraft ? (
        <Modal
          title={users.some((u) => u.id === techDraft.id) ? "تعديل حساب فني" : "إضافة فني"}
          onClose={() => {
            setTechDraft(null);
            setTechError(null);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسم الفني">
              <input
                type="text"
                className="field"
                value={techDraft.name}
                onChange={(e) => setTechDraft({ ...techDraft, name: e.target.value })}
              />
            </Field>
            <Field label="الموقع العام (إدخال حر)">
              <input
                type="text"
                className="field"
                placeholder="مثال: شعبة هيت، شعبة القائم"
                value={techDraft.location}
                onChange={(e) => setTechDraft({ ...techDraft, location: e.target.value })}
              />
            </Field>
            <Field label="اسم المستخدم">
              <input
                type="text"
                className="field"
                value={techDraft.username}
                onChange={(e) => setTechDraft({ ...techDraft, username: e.target.value })}
              />
            </Field>
            <Field label="كلمة المرور">
              <input
                type="text"
                className="field"
                value={techDraft.password}
                onChange={(e) => setTechDraft({ ...techDraft, password: e.target.value })}
              />
            </Field>
            <Field label="رقم الهاتف">
              <input
                type="text"
                className="field"
                value={techDraft.phone ?? ""}
                onChange={(e) => setTechDraft({ ...techDraft, phone: e.target.value })}
              />
            </Field>
          </div>
          {techError ? (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {techError}
            </p>
          ) : null}
          <button className="btn-primary mt-5 w-full" onClick={saveTech}>
            حفظ الحساب
          </button>
        </Modal>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4" onClick={onClose}>
      <div
        className="panel max-h-[88vh] w-full max-w-2xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="btn-soft">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
