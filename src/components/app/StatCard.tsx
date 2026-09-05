import type { LucideIcon } from "lucide-react";

const tones = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: keyof typeof tones;
}) {
  return (
    <div className="panel flex items-center gap-4 p-5">
      <span className={`grid size-12 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-6" />
      </span>
      <span>
        <span className="block text-2xl font-extrabold">{value}</span>
        <span className="block text-sm text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
