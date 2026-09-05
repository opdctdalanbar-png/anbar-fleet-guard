import { LogOut, Fuel } from "lucide-react";
import banner from "@/assets/banner.jpg";

type Props = {
  userName?: string;
  roleLabel?: string;
  onLogout?: () => void;
};

export function Banner({ userName, roleLabel, onLogout }: Props) {
  return (
    <header className="w-full max-w-full">
      <div className="relative w-full max-w-full overflow-hidden">
        <img
          src={banner}
          alt="محطات توليد الطاقة التابعة لشركة توزيع المنتجات النفطية"
          width={1920}
          height={540}
          className="h-40 w-full object-cover sm:h-56 lg:h-64"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary-deep/90 via-primary-deep/70 to-primary-deep/30" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3 text-primary-foreground">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/80 ring-1 ring-primary-foreground/30 sm:size-14">
                <Fuel className="size-6 sm:size-7" />
              </span>
              <div>
                <h1 className="text-base font-extrabold leading-tight sm:text-2xl">
                  شركة توزيع المنتجات النفطية — فرع الأنبار
                </h1>
                <p className="mt-1 text-[11px] font-medium opacity-90 sm:text-sm">
                  القسم الفني • شعبة الكهرباء • وحدة المولدات
                </p>
              </div>
            </div>

            {userName ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden text-left text-primary-foreground sm:block">
                  <p className="text-sm font-bold">{userName}</p>
                  <p className="text-xs opacity-85">{roleLabel}</p>
                </div>
                <button onClick={onLogout} className="btn-soft" type="button">
                  <LogOut className="size-4" />
                  خروج
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
