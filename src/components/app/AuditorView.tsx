import { useMemo, useState } from "react";
import { Gauge, CircleCheck, TriangleAlert, FileText, Printer, Filter } from "lucide-react";
import {
  MAINT_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
  type Generator,
  type MaintenanceType,
  type Report,
  type User,
} from "@/lib/genstore";
import { Banner } from "./Banner";
import { ReportPrintSheet } from "./ReportPrintSheet";
import { StatCard } from "./StatCard";

type Props = {
  user: User;
  generators: Generator[];
  reports: Report[];
  onLogout: () => void;
};

const MAINT_OPTIONS: MaintenanceType[] = ["لا يوجد", "صيانة وقائية", "صيانة طارئة", "عطل دائم"];

export function AuditorView({ user, generators, reports, onLogout }: Props) {
  const [openReport, setOpenReport] = useState<Report | null>(null);
  const [fDate, setFDate] = useState("");
  const [fLocation, setFLocation] = useState("all");
  const [fMaint, setFMaint] = useState("all");
  const [fTech, setFTech] = useState("all");

  const stats = useMemo(
    () => ({
      total: generators.length,
      active: generators.filter((g) => g.status === "working").length,
      maintenance: generators.filter((g) => g.status !== "working").length,
    }),
    [generators],
  );

  const locations = useMemo(
    () => Array.from(new Set(generators.map((g) => g.location).filter(Boolean))).sort(),
    [generators],
  );
  const techNames = useMemo(
    () => Array.from(new Set(reports.map((r) => r.techName).filter(Boolean))).sort(),
    [reports],
  );

  const filteredReports = useMemo(() => {
    return [...reports]
      .filter((r) => {
        if (fDate && r.date !== fDate) return false;
        const gen = generators.find((g) => g.id === r.generatorId);
        if (fLocation !== "all" && gen?.location !== fLocation) return false;
        if (fMaint !== "all" && r.maintenanceType !== fMaint) return false;
        if (fTech !== "all" && r.techName !== fTech) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reports, generators, fDate, fLocation, fMaint, fTech]);

  const hasFilters = fDate || fLocation !== "all" || fMaint !== "all" || fTech !== "all";

  return (
    <div className="min-h-screen bg-background">
      <Banner userName={user.name} roleLabel="المدقق الرسمي (اطلاع فقط)" onLogout={onLogout} />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard icon={Gauge} label="مجموع المولدات" value={stats.total} tone="primary" />
          <StatCard icon={CircleCheck} label="قيد العمل" value={stats.active} tone="success" />
          <StatCard
            icon={TriangleAlert}
            label="تحت الصيانة"
            value={stats.maintenance}
            tone="warning"
          />
        </div>

        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="text-base font-bold">سجل التقارير اليومية</h2>
            <button className="btn-primary" onClick={() => window.print()}>
              <Printer className="size-4" /> إصدار / طباعة التقرير
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-b border-border bg-secondary/40 px-5 py-4">
            <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Filter className="size-4" /> تصفية
            </span>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">التاريخ</span>
              <input
                type="date"
                className="field w-auto"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">الموقع العام</span>
              <select
                className="field w-auto"
                value={fLocation}
                onChange={(e) => setFLocation(e.target.value)}
              >
                <option value="all">كل المواقع</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">نوع الصيانة</span>
              <select
                className="field w-auto"
                value={fMaint}
                onChange={(e) => setFMaint(e.target.value)}
              >
                <option value="all">كل الأنواع</option>
                {MAINT_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">الفني</span>
              <select
                className="field w-auto"
                value={fTech}
                onChange={(e) => setFTech(e.target.value)}
              >
                <option value="all">كل الفنيين</option>
                {techNames.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            {hasFilters ? (
              <button
                className="btn-soft"
                onClick={() => {
                  setFDate("");
                  setFLocation("all");
                  setFMaint("all");
                  setFTech("all");
                }}
              >
                مسح التصفية
              </button>
            ) : null}
          </div>

          {filteredReports.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              {hasFilters ? "لا توجد تقارير مطابقة للتصفية الحالية." : "لا توجد تقارير مسجلة حتى الآن."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-right text-sm">
                <thead className="bg-secondary/70 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">التاريخ</th>
                    <th className="px-4 py-3 font-semibold">المولدة</th>
                    <th className="px-4 py-3 font-semibold">الموقع</th>
                    <th className="px-4 py-3 font-semibold">الفني</th>
                    <th className="px-4 py-3 font-semibold">نوع الصيانة</th>
                    <th className="px-4 py-3 font-semibold">ساعات العداد</th>
                    <th className="px-4 py-3 font-semibold">التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r) => {
                    const gen = generators.find((g) => g.id === r.generatorId);
                    return (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-4 py-3">{r.date}</td>
                        <td className="px-4 py-3 font-semibold">
                          {gen ? `${gen.code} — ${gen.name}` : "—"}
                        </td>
                        <td className="px-4 py-3">{gen?.location ?? "—"}</td>
                        <td className="px-4 py-3">{r.techName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${MAINT_CLASS[r.maintenanceType]}`}
                          >
                            {r.maintenanceType}
                          </span>
                        </td>
                        <td className="px-4 py-3">{r.meterHours || "—"}</td>
                        <td className="px-4 py-3">
                          <button className="btn-soft" onClick={() => setOpenReport(r)}>
                            <FileText className="size-4" />
                            عرض
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel overflow-hidden">
          <h2 className="border-b border-border px-5 py-4 text-base font-bold">حالة الأسطول</h2>
          {generators.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              لا توجد مولدات مسجلة.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {generators.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="text-sm font-semibold">
                    {g.code} — {g.name}{" "}
                    <span className="font-normal text-muted-foreground">({g.location})</span>
                  </span>
                  <span
                    className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CLASS[g.status]}`}
                  >
                    {STATUS_LABEL[g.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {openReport ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4"
          onClick={() => setOpenReport(null)}
        >
          <div
            className="panel max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold">تفاصيل التقرير — {openReport.date}</h3>
              <button className="btn-primary" onClick={() => window.print()}>
                <Printer className="size-4" /> طباعة التقرير الفني
              </button>
            </div>
            {(() => {
              const g = generators.find((x) => x.id === openReport.generatorId);
              return (
                <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="mb-2 text-xs font-bold text-muted-foreground">بيانات المولدة</p>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    {[
                      ["رمز المولدة", g?.code],
                      ["اسم / نوع المولدة", g?.name],
                      ["الموقع العام", g?.location],
                      ["الموقع الخاص", g?.specificLocation],
                      ["رقم المحرك", g?.engineSerial],
                      ["رقم رأس التوليد", g?.alternatorSerial],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="rounded-lg border border-border bg-card px-3 py-2"
                      >
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="text-sm font-semibold">{v || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })()}
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["الفني", openReport.techName],
                ["ساعات العداد", openReport.meterHours],
                ["نوع الصيانة", openReport.maintenanceType],
                ["الزيت", openReport.oilStatus],
                ["الفلتر", openReport.filterStatus],
                ["التبريد", openReport.coolingStatus],
                ["فولتية البطارية", openReport.batteryVoltage],
                ["فولتية الشحن", openReport.chargingVoltage],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-secondary/50 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-semibold">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm">
              <span className="block text-xs text-muted-foreground">ملاحظات العمل</span>
              {openReport.notes || "—"}
            </p>
            {openReport.photos.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {openReport.photos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`صورة ميدانية ${i + 1}`}
                    className="h-28 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : null}
            <button className="btn-primary mt-5 w-full" onClick={() => setOpenReport(null)}>
              إغلاق
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
