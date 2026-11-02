
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#overview">
        Skip to dashboard
      </a>

      <Sidebar />

      <main className="main-content" id="main-content">
        {children}
      </main>
    </div>
  );
}
