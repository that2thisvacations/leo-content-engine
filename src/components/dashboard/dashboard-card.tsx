import type { DashboardArea } from "@/lib/dashboard";

type DashboardCardProps = {
  area: DashboardArea;
  index: number;
};

export function DashboardCard({ area, index }: DashboardCardProps) {
  return (
    <article className="dashboard-card" id={area.id}>
      <div className="card-topline">
        <span className="card-number" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        <span className="status-pill">Foundation ready</span>
      </div>
      <h3>{area.label}</h3>
      <p>{area.description}</p>
      <div className="card-footer">
        <span>{area.stage}</span>
        <strong>{area.initialState}</strong>
      </div>
    </article>
  );
}
