import { supabase } from "@/integrations/supabase/client";
import type { Generator, GenStatus, MaintenanceType, Report, Role, User } from "./genstore";

const BUCKET = "report-photos";

type GenRow = {
  id: string;
  code: string;
  name: string;
  location: string;
  specific_location: string;
  capacity: string;
  engine_serial: string | null;
  alternator_serial: string | null;
  status: string;
  last_oil_change: string | null;
  last_filter_change: string | null;
  last_battery_change: string | null;
  created_at: string;
};

type ReportRow = {
  id: string;
  generator_id: string;
  date: string;
  tech_id: string;
  tech_name: string;
  meter_hours: string;
  maintenance_type: string;
  oil_status: string;
  filter_status: string;
  cooling_status: string;
  battery_status: string | null;
  battery_voltage: string;
  charging_voltage: string;
  oil_changed_on: string | null;
  filter_changed_on: string | null;
  battery_changed_on: string | null;
  notes: string;
  photos: string[];
  created_at: string;
};

export function genFromRow(r: GenRow): Generator {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    location: r.location,
    specificLocation: r.specific_location,
    capacity: r.capacity,
    engineSerial: r.engine_serial ?? "",
    alternatorSerial: r.alternator_serial ?? "",
    status: (r.status as GenStatus) ?? "working",
    lastOilChange: r.last_oil_change ?? undefined,
    lastFilterChange: r.last_filter_change ?? undefined,
    lastBatteryChange: r.last_battery_change ?? undefined,
    createdAt: r.created_at,
  };
}

export function genToRow(g: Generator) {
  return {
    code: g.code,
    name: g.name,
    location: g.location,
    specific_location: g.specificLocation,
    capacity: g.capacity,
    engine_serial: g.engineSerial ?? null,
    alternator_serial: g.alternatorSerial ?? null,
    status: g.status,
    last_oil_change: g.lastOilChange ?? null,
    last_filter_change: g.lastFilterChange ?? null,
    last_battery_change: g.lastBatteryChange ?? null,
  };
}

function reportFromRow(r: ReportRow, photoUrls: string[]): Report {
  return {
    id: r.id,
    generatorId: r.generator_id,
    date: r.date,
    techId: r.tech_id,
    techName: r.tech_name,
    meterHours: r.meter_hours,
    maintenanceType: r.maintenance_type as MaintenanceType,
    oilStatus: r.oil_status,
    filterStatus: r.filter_status,
    coolingStatus: r.cooling_status,
    batteryStatus: r.battery_status ?? "",
    batteryVoltage: r.battery_voltage,
    chargingVoltage: r.charging_voltage,
    oilChangedOn: r.oil_changed_on ?? undefined,
    filterChangedOn: r.filter_changed_on ?? undefined,
    batteryChangedOn: r.battery_changed_on ?? undefined,
    notes: r.notes,
    photos: photoUrls,
    createdAt: r.created_at,
  };
}

export async function fetchGenerators(): Promise<Generator[]> {
  const { data, error } = await supabase
    .from("generators")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as GenRow[]).map(genFromRow);
}

export async function fetchReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data as ReportRow[];

  const paths = Array.from(new Set(rows.flatMap((r) => r.photos ?? [])));
  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 8);
    (signed ?? []).forEach((s) => {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    });
  }

  return rows.map((r) =>
    reportFromRow(
      r,
      (r.photos ?? []).map((p) => urlByPath.get(p) ?? p),
    ),
  );
}

export async function fetchUsers(): Promise<User[]> {
  const [{ data: profiles, error }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (error) throw error;
  const roleByUser = new Map<string, Role>();
  (roles ?? []).forEach((r: { user_id: string; role: string }) =>
    roleByUser.set(r.user_id, r.role as Role),
  );
  return (profiles ?? []).map((p: any) => ({
    id: p.id,
    username: p.username,
    password: "",
    name: p.name,
    role: roleByUser.get(p.id) ?? "technician",
    location: p.location ?? "",
    phone: p.phone ?? "",
  }));
}

export async function fetchMyAccount(userId: string): Promise<User | null> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  if (!profile) return null;
  const role = ((roles ?? [])[0]?.role as Role) ?? "technician";
  return {
    id: profile.id,
    username: profile.username,
    password: "",
    name: profile.name,
    role,
    location: profile.location ?? "",
    phone: profile.phone ?? "",
  };
}

/** Turns data-URL photos into storage objects and returns stored object paths. */
export async function persistPhotos(photos: string[], userId: string): Promise<string[]> {
  const paths: string[] = [];
  for (const photo of photos) {
    if (photo.startsWith("data:")) {
      const blob = await (await fetch(photo)).blob();
      const ext = (blob.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: false,
      });
      if (error) throw error;
      paths.push(path);
    } else {
      const match = photo.match(/report-photos\/(.+?)(\?|$)/);
      paths.push(match?.[1] ? decodeURIComponent(match[1]) : photo);
    }
  }
  return paths;
}

export async function saveReport(report: Report, photoPaths: string[]) {
  const payload = {
    generator_id: report.generatorId,
    date: report.date,
    tech_id: report.techId,
    tech_name: report.techName,
    meter_hours: report.meterHours,
    maintenance_type: report.maintenanceType,
    oil_status: report.oilStatus,
    filter_status: report.filterStatus,
    cooling_status: report.coolingStatus,
    battery_status: report.batteryStatus ?? null,
    battery_voltage: report.batteryVoltage,
    charging_voltage: report.chargingVoltage,
    oil_changed_on: report.oilChangedOn ?? null,
    filter_changed_on: report.filterChangedOn ?? null,
    battery_changed_on: report.batteryChangedOn ?? null,
    notes: report.notes,
    photos: photoPaths,
  };
  const { error } = await supabase
    .from("reports")
    .upsert(payload, { onConflict: "generator_id,date" });
  if (error) throw error;
}
