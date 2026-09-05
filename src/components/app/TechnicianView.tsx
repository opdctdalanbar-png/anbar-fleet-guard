import { useMemo, useState } from "react";
import { ClipboardList, Camera, Trash2, CircleCheck } from "lucide-react";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  todayKey,
  uid,
  type Generator,
  type MaintenanceType,
  type Report,
  type User,
} from "@/lib/genstore";
import { Banner } from "./Banner";

type Props = {
  user: User;
  generators: Generator[];
  reports: Report[];
  onSubmitReport: (report: Report) => void;
  onLogout: () => void;
};

const MAINT: MaintenanceType[] = ["لا يوجد", "صيانة وقائية", "صيانة طارئة", "عطل دائم"];

const blank = (generatorId: string, user: User): Report => ({
  id: uid(),
  generatorId,
  date: todayKey(),
  techId: user.id,
  techName: user.name,
  meterHours: "",
  maintenanceType: "لا يوجد",
  oilStatus: "جيد",
  filterStatus: "جيد",
  coolingStatus: "جيد",
  batteryStatus: "جيدة",
  batteryVoltage: "",
  chargingVoltage: "",
  notes: "",
  photos: [],
  createdAt: new Date().toISOString(),
});

export function TechnicianView({ user, generators, reports, onSubmitReport, onLogout }: Props) {
  const mine = useMemo(
    () => generators.filter((g) => g.location.trim() === user.location.trim()),
    [generators, user.location],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Report | null>(null);
  const [saved, setSaved] = useState(false);
  const [subFilter, setSubFilter] = useState("all");

  const subLocations = useMemo(
    () =>
      Array.from(
        new Set(mine.map((g) => g.specificLocation.trim()).filter((s) => s.length > 0)),
      ),
    [mine],
  );

  const visible = useMemo(
    () =>
      subFilter === "all"
        ? mine
        : mine.filter((g) => g.specificLocation.trim() === subFilter),
    [mine, subFilter],
  );

  const selectedGen = useMemo(
    () => generators.find((g) => g.id === selected) ?? null,
    [generators, selected],
  );

  const openGenerator = (g: Generator) => {
    const existing = reports.find((r) => r.generatorId === g.id && r.date === todayKey());
    setSelected(g.id);
    setDraft(existing ? { ...existing } : blank(g.id, user));
    setSaved(false);
  };

  const editMode = Boolean(
    draft && reports.some((r) => r.generatorId === draft.generatorId && r.date === todayKey()),
  );

  const addPhotos = (files: FileList | null) => {
    if (!files || !draft) return;
    const room = 5 - draft.photos.length;
    Array.from(files)
      .slice(0, Math.max(room, 0))
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () =>
          setDraft((d) =>
            d && d.photos.length < 5 ? { ...d, photos: [...d.photos, String(reader.result)] } : d,
          );
        reader.readAsDataURL(file);
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <Banner
        userName={user.name}
        roleLabel={`فني ميداني — ${user.location || "بدون موقع"}`}
        onLogout={onLogout}
      />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <section className="panel h-fit overflow-hidden">
          <h2 className="border-b border-border px-4 py-3 text-sm font-bold">
            مولدات موقعي ({mine.length})
          </h2>
          {mine.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              لا توجد مولدات مخصصة لموقعك.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {mine.map((g) => {
                const done = reports.some(
                  (r) => r.generatorId === g.id && r.date === todayKey(),
                );
                return (
                  <li key={g.id}>
                    <button
                      onClick={() => openGenerator(g)}
                      className={`w-full px-4 py-3 text-right ${selected === g.id ? "bg-accent" : "hover:bg-secondary"}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{g.name || g.code}</span>
                        {done ? <CircleCheck className="size-4 text-success" /> : null}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {g.code}
                          {g.specificLocation ? ` — ${g.specificLocation}` : ""}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[g.status]}`}
                        >
                          {STATUS_LABEL[g.status]}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel p-6">
          {!draft ? (
            <p className="py-20 text-center text-sm text-muted-foreground">
              اختر مولدة من القائمة لتسجيل التقرير اليومي.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitReport(draft);
                setSaved(true);
              }}
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <ClipboardList className="size-5 text-primary" />
                  التقرير اليومي — {todayKey()}
                </h2>
                {editMode ? (
                  <span className="rounded-full border border-warning/30 bg-warning/15 px-3 py-1 text-xs font-bold text-warning">
                    وضع التعديل: تم تقديم تقرير اليوم لهذه المولدة
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <L label="قراءة العداد (ساعات)">
                  <input
                    type="number"
                    className="field"
                    value={draft.meterHours}
                    onChange={(e) => setDraft({ ...draft, meterHours: e.target.value })}
                    required
                  />
                </L>
                <L label="نوع الصيانة">
                  <select
                    className="field"
                    value={draft.maintenanceType}
                    onChange={(e) =>
                      setDraft({ ...draft, maintenanceType: e.target.value as MaintenanceType })
                    }
                  >
                    {MAINT.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </L>
                <L label="حالة الزيت">
                  <select
                    className="field"
                    value={draft.oilStatus}
                    onChange={(e) => setDraft({ ...draft, oilStatus: e.target.value })}
                  >
                    {["جيد", "يحتاج إضافة", "تم التبديل", "ضعيف"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </L>
                <L label="حالة الفلتر">
                  <select
                    className="field"
                    value={draft.filterStatus}
                    onChange={(e) => setDraft({ ...draft, filterStatus: e.target.value })}
                  >
                    {["جيد", "يحتاج تنظيف", "تم التبديل", "تالف"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </L>
                <L label="منظومة التبريد">
                  <select
                    className="field"
                    value={draft.coolingStatus}
                    onChange={(e) => setDraft({ ...draft, coolingStatus: e.target.value })}
                  >
                    {["جيد", "نقص ماء", "تسرب", "عطل مروحة"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </L>
                <L label="فولتية البطارية (V)">
                  <input
                    type="number"
                    step="0.1"
                    className="field"
                    value={draft.batteryVoltage}
                    onChange={(e) => setDraft({ ...draft, batteryVoltage: e.target.value })}
                  />
                </L>
                <L label="فولتية الشحن (V)">
                  <input
                    type="number"
                    step="0.1"
                    className="field"
                    value={draft.chargingVoltage}
                    onChange={(e) => setDraft({ ...draft, chargingVoltage: e.target.value })}
                  />
                </L>
              </div>

              <L label="ملاحظات العمل المنجز">
                <textarea
                  className="field mt-4 min-h-24"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </L>

              <div className="mt-4">
                <span className="mb-1 block text-sm font-semibold">
                  صور ميدانية (حد أقصى 5) — {draft.photos.length}/5
                </span>
                <label className="btn-soft cursor-pointer">
                  <Camera className="size-4" /> إضافة صور
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addPhotos(e.target.files)}
                  />
                </label>
                {draft.photos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {draft.photos.map((src, i) => (
                      <div key={i} className="relative">
                        <img
                          src={src}
                          alt={`صورة ${i + 1}`}
                          className="h-24 w-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({ ...draft, photos: draft.photos.filter((_, x) => x !== i) })
                          }
                          className="absolute left-1 top-1 rounded-md bg-destructive p-1 text-destructive-foreground"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {saved ? (
                <p className="mt-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  تم حفظ التقرير وتحديث حالة المولدة.
                </p>
              ) : null}

              <button type="submit" className="btn-primary mt-5 w-full">
                {editMode ? "تحديث تقرير اليوم" : "إرسال التقرير"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
