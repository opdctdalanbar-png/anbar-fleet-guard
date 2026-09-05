import { LogOut } from "lucide-react";

const BANNER_URL =
  "/__l5e/assets-v1/75401baa-d2ff-49c0-b460-b507a819913f/banner-official.jpg";

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
          src={BANNER_URL}
          alt="الترويسة الرسمية — هيأة توزيع المنتجات النفطية، فرع الأنبار، القسم الفني، شعبة الكهرباء، وحدة المولدات"
          width={951}
          height={233}
          className="max-h-64 w-full object-cover object-top sm:max-h-72"
        />
        {userName ? (
          <div className="absolute inset-y-0 left-0 flex items-center p-3 sm:p-5">
            <div className="flex items-center gap-2 rounded-xl bg-foreground/45 px-3 py-2 backdrop-blur-sm sm:gap-3 sm:px-4">
              <div className="hidden text-left text-primary-foreground sm:block">
                <p className="text-sm font-bold">{userName}</p>
                <p className="text-xs opacity-85">{roleLabel}</p>
              </div>
              <button onClick={onLogout} className="btn-soft" type="button">
                <LogOut className="size-4" />
                خروج
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
