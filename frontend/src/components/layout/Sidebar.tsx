
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Database,
  LayoutDashboard,
  Wind,
  Zap,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Generation", href: "#generation", icon: Wind },
  { label: "Analytics", href: "#analytics", icon: BarChart3 },
  { label: "Forecast evolution", href: "#evolution", icon: Activity },
  { label: "Data quality", href: "#quality", icon: Database },
];

export default function Sidebar() {
  const [activeSection, setActiveSection] = useState("#overview");

  useEffect(() => {
    const updateActiveSection = () => {
      setActiveSection(window.location.hash || "#overview");
    };

    updateActiveSection();

    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, []);

  return (
    <aside className="sidebar">
      <a
        href="#overview"
        className="brand"
        aria-label="Elexon Wind Intelligence home"
      >
        <div className="brand-icon">
          <Zap size={23} fill="currentColor" />
        </div>

        <div>
          <div className="brand-name">ELEXON</div>
          <div className="brand-caption">WIND INTELLIGENCE</div>
        </div>
      </a>

      <div className="sidebar-label">WORKSPACE</div>

      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {navigation.map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            onClick={() => setActiveSection(href)}
            className={`nav-link ${
              activeSection === href ? "active" : ""
            }`}
            aria-current={
              activeSection === href ? "location" : undefined
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="source-indicator">
          <span className="status-dot" />

          <div>
            <strong>Data source connected</strong>
            <span>Elexon BMRS</span>
          </div>
        </div>

        <div className="sidebar-footer">
          WIND INTELLIGENCE · 2026
        </div>
      </div>
    </aside>
  );
}
