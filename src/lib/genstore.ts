export type Role = "engineer" | "auditor" | "technician";

export type User = {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
  location: string;
  phone?: string;
};

export type GenStatus = "working" | "preventive" | "fault";

export type Generator = {
  id: string;
  code: string;
  name: string;
  location: string;
  specificLocation: string;
  capacity: string;
  engineSerial?: string;
  alternatorSerial?: string;
  status: GenStatus;
  lastOilChange?: string | undefined;
  lastFilterChange?: string | undefined;
  lastBatteryChange?: string | undefined;
  createdAt: string;
};

export type MaintenanceType = "لا يوجد" | "صيانة وقائية" | "صيانة طارئة" | "عطل دائم";

export type Report = {
  id: string;
  generatorId: string;
  date: string; // YYYY-MM-DD
  techId: string;
  techName: string;
  meterHours: string;
  maintenanceType: MaintenanceType;
  oilStatus: string;
  filterStatus: string;
  coolingStatus: string;
  batteryStatus?: string;
  batteryVoltage: string;
  chargingVoltage: string;
  oilChangedOn?: string | undefined;
  filterChangedOn?: string | undefined;
  batteryChangedOn?: string | undefined;
  notes: string;
  photos: string[];
  createdAt: string;
};


export const todayKey = () => new Date().toISOString().slice(0, 10);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function statusFromMaintenance(type: MaintenanceType): GenStatus {
  if (type === "صيانة وقائية") return "preventive";
  if (type === "صيانة طارئة" || type === "عطل دائم") return "fault";
  return "working";
}

export const STATUS_LABEL: Record<GenStatus, string> = {
  working: "قيد العمل",
  preventive: "صيانة وقائية",
  fault: "عطل دائم / طارئ",
};

export const STATUS_CLASS: Record<GenStatus, string> = {
  working: "bg-success/15 text-success border-success/30",
  preventive: "bg-warning/15 text-warning border-warning/30",
  fault: "bg-destructive/15 text-destructive border-destructive/30",
};

export const MAINT_CLASS: Record<MaintenanceType, string> = {
  "لا يوجد": "bg-success/15 text-success border-success/30",
  "صيانة وقائية": "bg-warning/15 text-warning border-warning/30",
  "صيانة طارئة": "bg-destructive/15 text-destructive border-destructive/30",
  "عطل دائم": "bg-destructive/15 text-destructive border-destructive/30",
};
