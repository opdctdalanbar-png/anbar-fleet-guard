import { useState } from "react";
import { KeyRound, User as UserIcon, ShieldCheck, HardHat, Wrench } from "lucide-react";
import { Banner } from "./Banner";

type Props = {
  onLogin: (username: string, password: string) => string | null;
};

const helpers = [
  { icon: HardHat, role: "مهندس النظام (مسؤول)", u: "eng_admin", p: "Eng#2026" },
  { icon: ShieldCheck, role: "المدقق الرسمي", u: "official_user", p: "Auth#2026" },
  { icon: Wrench, role: "الفني الميداني", u: "tech_anbar", p: "Tech#2026" },
];

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Banner />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-lg font-bold">تسجيل الدخول إلى منظومة وحدة المولدات</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            أدخل اسم المستخدم وكلمة المرور الخاصة بحسابك.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const err = onLogin(username.trim(), password);
              setError(err);
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-semibold">اسم المستخدم</label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="field pr-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">كلمة المرور</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  className="field pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn-primary w-full">
              دخول
            </button>
          </form>
        </section>

        <section className="panel p-6">
          <h2 className="text-lg font-bold">بيانات الدخول الفعالة</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            الحسابات الأساسية للنظام، إضافةً إلى أي حساب فني يضيفه المهندس.
          </p>
          <ul className="mt-5 space-y-3">
            {helpers.map((h) => (
              <li
                key={h.u}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/60 px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                    <h.icon className="size-4" />
                  </span>
                  <span className="text-sm font-semibold">{h.role}</span>
                </span>
                <span className="text-left font-mono text-xs leading-5 text-muted-foreground">
                  <span className="block">{h.u}</span>
                  <span className="block">{h.p}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
