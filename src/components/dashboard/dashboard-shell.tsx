import type { ReactNode } from "react";

import { dashboardAreas } from "@/lib/dashboard";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="LEO Content Engine home">
          <span className="brand-mark" aria-hidden="true">
            LEO
          </span>
          <span className="brand-copy">
            <strong>Content Engine</strong>
            <span>Production OS</span>
          </span>
        </a>

        <nav className="navigation" aria-label="Production areas">
          {dashboardAreas.map((area, index) => (
            <a className="nav-link" href={`#${area.id}`} key={area.id}>
              <span className="nav-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {area.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          Provider adapters are isolated and waiting for approved credentials.
        </div>
      </aside>
      <main className="main-content" id="top">
        {children}
      </main>
    </div>
  );
}
