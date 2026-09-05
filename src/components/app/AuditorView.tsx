import { useMemo, useState } from "react";
import { Gauge, CircleCheck, TriangleAlert, FileText } from "lucide-react";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  type Generator,
  type Report,
  type User,
} from "@/lib/genstore";
import { Banner } from "./Banner";
import { StatCard } from "./StatCard";

type Props = {
  user: User;
  generators: Generator[];
  reports: Report[];
  onLogout: () => void;
};

export function AuditorView({ user, generators, reports, onLogout }: Props) {
  const [openReport, setOpenReport] = useState<Report | null>(null);

  const stats = useMemo(
    () => ({
      total: generators.length,
      active: generators.filter((g) => g.status === "working").length,
      maintenance: generators.filter((g) => g.status !== "working").length,
    }),
    [generators],
  );

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reports],
  );

  return (
    <div className="min-h-screen bg-background">
      <Banner userName={user.name} roleLabel="المدقق الرسمي (اطلاع فقط)" onLogout={onLogout} />
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

        <section className="panel overflow-hidden">
          <h2 className="border-b border-border px-5 py-4 text-base font-bold">
            سجل التقارير اليومية
          </h2>
          {sortedReports.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              لا توجد تقارير مسجلة حتى الآن.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
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
                  {sortedReports.map((r) => {
                    const gen = generators.find((g) => g.id === r.generatorId);
                    return (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-4 py-3">{r.date}</td>
                        <td className="px-4 py-3 font-semibold">
                          {gen ? `${gen.code} — ${gen.name}` : "—"}
                        </td>
                        <td className="px-4 py-3">{gen?.location ?? "—"}</td>
                        <td className="px-4 py-3">{r.techName}</td>
                        <td className="px-4 py-3">{r.maintenanceType}</td>
                        <td className="px-4 py-3">{r.meterHours}</td>
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
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CLASS[g.status]}`}
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
            <h3 className="text-lg font-bold">تفاصيل التقرير — {openReport.date}</h3>
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
