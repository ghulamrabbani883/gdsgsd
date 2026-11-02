
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-title">{title}</span>
        <div className={`kpi-icon ${accent}`}>
          <Icon size={19} />
        </div>
      </div>

      <div className="kpi-value">{value}</div>
      <div className="kpi-subtitle">{subtitle}</div>
    </div>
  );
}
