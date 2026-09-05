export type Role = "engineer" | "auditor" | "technician";

export type User = {
  id: string;
  username: string;
  password: string;
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
  status: GenStatus;
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
  batteryVoltage: string;
  chargingVoltage: string;
  notes: string;
  photos: string[];
  createdAt: string;
};

const K = {
  users: "opdc_users_v1",
  gens: "opdc_generators_v1",
  reports: "opdc_reports_v1",
  session: "opdc_session_v1",
};

export const DEFAULT_USERS: User[] = [
  {
    id: "u-eng",
    username: "eng_admin",
    password: "Eng#2026",
    name: "المهندس المسؤول عن النظام",
    role: "engineer",
    location: "فرع الأنبار",
  },
  {
    id: "u-off",
    username: "official_user",
    password: "Auth#2026",
    name: "المدقق الرسمي",
    role: "auditor",
    location: "فرع الأنبار",
  },
  {
    id: "u-tech",
    username: "tech_anbar",
    password: "Tech#2026",
    name: "فني الوحدة - الرمادي",
    role: "technician",
    location: "شعبة الرمادي",
  },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  getUsers(): User[] {
    const users = read<User[]>(K.users, []);
    if (users.length === 0) {
      write(K.users, DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    // ensure the three fixed accounts always exist
    const merged = [...users];
    for (const d of DEFAULT_USERS) {
      if (!merged.some((u) => u.username === d.username)) merged.push(d);
    }
    if (merged.length !== users.length) write(K.users, merged);
    return merged;
  },
  setUsers(users: User[]) {
    write(K.users, users);
  },
  getGenerators(): Generator[] {
    return read<Generator[]>(K.gens, []);
  },
  setGenerators(gens: Generator[]) {
    write(K.gens, gens);
  },
  getReports(): Report[] {
    return read<Report[]>(K.reports, []);
  },
  setReports(reports: Report[]) {
    write(K.reports, reports);
  },
  getSession(): string | null {
    return read<string | null>(K.session, null);
  },
  setSession(userId: string | null) {
    write(K.session, userId);
  },
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
