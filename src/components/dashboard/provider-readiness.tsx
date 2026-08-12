import { providerSlots } from "@/lib/providers/catalog";

export function ProviderReadiness() {
  return (
    <section className="readiness-panel" aria-labelledby="readiness-heading">
      <div className="readiness-intro">
        <p className="eyebrow">Integration boundary</p>
        <h2 id="readiness-heading">Provider-ready, intentionally disconnected</h2>
        <p>
          Each capability has a typed adapter boundary. Credentials and vendor SDKs can be
          added later without coupling them to the dashboard.
        </p>
      </div>
      <ul className="provider-list">
        {providerSlots.map((provider) => (
          <li className="provider-item" key={provider.capability}>
            <div>
              <strong>{provider.label}</strong>
              <span>{provider.description}</span>
            </div>
            <span className="provider-state">Not connected</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
