// Shared helpers for turning a username into the internal login email.
export const ACCOUNT_EMAIL_DOMAIN = "opdc-anbar.local";

export function emailForUsername(username: string): string {
  return `${username.trim().toLowerCase()}@${ACCOUNT_EMAIL_DOMAIN}`;
}

export const SEED_ACCOUNTS = [
  {
    username: "eng_admin",
    password: "Eng#2026",
    name: "المهندس المسؤول عن النظام",
    role: "engineer" as const,
    location: "فرع الأنبار",
  },
  {
    username: "official_user",
    password: "Auth#2026",
    name: "المدقق الرسمي",
    role: "auditor" as const,
    location: "فرع الأنبار",
  },
  {
    username: "tech_anbar",
    password: "Tech#2026",
    name: "فني الوحدة - الرمادي",
    role: "technician" as const,
    location: "شعبة الرمادي",
  },
];
