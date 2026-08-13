import Image from "next/image";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProviderReadiness } from "@/components/dashboard/provider-readiness";
import { dashboardAreas, dashboardMetrics } from "@/lib/dashboard";

import styles from "./page.module.css";

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
        <div className={styles.heroStage}>
          <div className="hero-copy">
            <span className="hero-kicker">LEO production pipeline</span>
            <h2 id="pipeline-heading">The workspace is ready for its first adventure.</h2>
            <p>
              Core production areas are established. Provider adapters remain intentionally
              disconnected until credentials and governance rules are approved.
            </p>
          </div>

          <div className={styles.leoStage} aria-label="LEO, the trusted travel companion">
            <span className={styles.tailGlow} aria-hidden="true" />
            <Image
              className={styles.leoImage}
              src="/leo/leo-hero.png"
              alt="LEO, the lion cub travel companion, wearing explorer gear and carrying his passport satchel"
              width={512}
              height={768}
              priority
              sizes="(max-width: 672px) 230px, (max-width: 1248px) 280px, 330px"
            />
          </div>
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
