import { useState } from "react";
import { KeyRound, User as UserIcon } from "lucide-react";
import { Banner } from "./Banner";

type Props = {
  onLogin: (username: string, password: string) => string | null;
};

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Banner />
      <main className="mx-auto flex w-full max-w-xl justify-center px-4 py-8 sm:px-6">
        <section className="panel w-full p-6">
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
              تسجيل الدخول
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
