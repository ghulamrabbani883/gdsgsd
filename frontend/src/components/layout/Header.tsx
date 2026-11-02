
import { CalendarDays, RefreshCw } from "lucide-react";

interface HeaderProps {
  period?: string;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
}

export default function Header({
  period = "January 2026",
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  return (
    <header className="topbar">
      <div>
        <div className="breadcrumb">
          ENERGY INTELLIGENCE <span>/</span> OVERVIEW
        </div>
        <h1>Wind generation overview</h1>
        <p>National wind generation forecast performance</p>
      </div>

      <div className="header-actions">
        <div className="period-pill">
          <CalendarDays size={16} />
          {period}
        </div>

        <button
          className="refresh-button"
          onClick={() => void onRefresh?.()}
          disabled={isRefreshing}
          title="Refresh all dashboard data"
          aria-label="Refresh all dashboard data"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "spin" : ""}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </header>
  );
}
