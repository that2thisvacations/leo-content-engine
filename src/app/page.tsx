import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProviderReadiness } from "@/components/dashboard/provider-readiness";
import { dashboardAreas, dashboardMetrics } from "@/lib/dashboard";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Production workspace</p>
          <h1>Good morning, LEO team.</h1>
          <p className="page-subtitle">
            One calm command center for turning destination ideas into thoughtful,
            family-ready stories.
          </p>
        </div>
        <div className="environment-badge" aria-label="Foundation system status">
          <span className="pulse-dot" aria-hidden="true" />
          Foundation online
        </div>
      </header>

      <section className="hero-panel" aria-labelledby="pipeline-heading">
        <div className="hero-copy">
          <span className="hero-kicker">LEO production pipeline</span>
          <h2 id="pipeline-heading">The workspace is ready for its first adventure.</h2>
          <p>
            Core production areas are established. Provider adapters remain intentionally
            disconnected until credentials and governance rules are approved.
          </p>
        </div>
        <div className="metric-grid" aria-label="Pipeline summary">
          {dashboardMetrics.map((metric) => (
            <div className="metric" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="workspace-heading">
        <div className="section-heading">
          <div>
            <h2 id="workspace-heading">Production areas</h2>
            <p>Purpose-built spaces, ready to grow as the workflow is connected.</p>
          </div>
        </div>
        <div className="dashboard-grid">
          {dashboardAreas.map((area, index) => (
            <DashboardCard area={area} index={index + 1} key={area.id} />
          ))}
        </div>
      </section>

      <ProviderReadiness />
    </DashboardShell>
  );
}
