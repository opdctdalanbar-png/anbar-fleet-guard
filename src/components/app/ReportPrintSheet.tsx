import { createPortal } from "react-dom";
import type { Generator, Report } from "@/lib/genstore";

type Props = {
  report: Report;
  generator?: Generator | undefined;
};

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <th className="w-40 border border-gray-400 bg-gray-100 px-3 py-1.5 text-right font-bold">
        {label}
      </th>
      <td className="border border-gray-400 px-3 py-1.5">{value || "—"}</td>
    </tr>
  );
}

export function ReportPrintSheet({ report, generator }: Props) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div id="print-sheet" dir="rtl">
      <div className="print-page">
        <header className="mb-4 text-center">
          <h1 className="text-lg font-bold">شركة توزيع المنتجات النفطية</h1>
          <p className="text-sm font-semibold">
            هيأة توزيع الغربية — فرع الأنبار — القسم الفني — شعبة الكهرباء — وحدة المولدات
          </p>
          <p className="mt-2 inline-block border border-gray-600 px-4 py-1 text-sm font-bold">
            تقرير فني يومي — {report.date}
          </p>
        </header>

        <h2 className="mb-1 text-sm font-bold">بيانات المولدة</h2>
        <table className="mb-4 w-full border-collapse text-sm">
          <tbody>
            <Row label="رمز المولدة" value={generator?.code} />
            <Row label="اسم / نوع المولدة" value={generator?.name} />
            <Row label="الموقع العام" value={generator?.location} />
            <Row label="الموقع الخاص" value={generator?.specificLocation} />
            <Row label="القدرة" value={generator?.capacity} />
            <Row label="رقم المحرك" value={generator?.engineSerial} />
            <Row label="رقم رأس التوليد" value={generator?.alternatorSerial} />
          </tbody>
        </table>

        <h2 className="mb-1 text-sm font-bold">بيانات الفحص اليومي</h2>
        <table className="mb-4 w-full border-collapse text-sm">
          <tbody>
            <Row label="الفني" value={report.techName} />
            <Row label="ساعات العداد" value={report.meterHours} />
            <Row label="نوع الصيانة" value={report.maintenanceType} />
            <Row label="الزيت" value={report.oilStatus} />
            <Row label="الفلتر" value={report.filterStatus} />
            <Row label="التبريد" value={report.coolingStatus} />
            <Row label="فولتية البطارية" value={report.batteryVoltage} />
            <Row label="فولتية الشحن" value={report.chargingVoltage} />
            <Row label="ملاحظات العمل" value={report.notes} />
          </tbody>
        </table>

        <footer className="mt-10 flex justify-between text-sm font-bold">
          <div className="text-center">
            <p>توقيع الفني</p>
            <p className="mt-8">الاسم: {report.techName}</p>
            <p className="mt-4">التوقيع: ........................</p>
          </div>
          <div className="text-center">
            <p>مسؤول وحدة المولدات</p>
            <p className="mt-8">الاسم: ........................</p>
            <p className="mt-4">التوقيع: ........................</p>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
