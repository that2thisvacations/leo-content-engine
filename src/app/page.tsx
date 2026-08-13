import Image from "next/image";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProviderReadiness } from "@/components/dashboard/provider-readiness";

import styles from "./page.module.css";

const productionSteps = [
  ["01", "Research", "Destination, culture, history, food, language, activities"],
  ["02", "Write", "LEO episode script, Money Moment™, learning beats, CTA"],
  ["03", "Create", "Storyboard, scenes, voice, music, captions, thumbnail"],
  ["04", "Review", "One human approval for safety, facts and quality"],
  ["05", "Publish", "Full YouTube episode, Shorts, metadata and parent page"],
] as const;

export default function DashboardPage() {
  return (
    <DashboardShell>
      <header className={styles.topbar}>
        <div>
          <p className="eyebrow">LEO YouTube Studio</p>
          <h1>Build the channel. LEO explores the world.</h1>
          <p className="page-subtitle">
            The automated production studio behind LEO&apos;s travel-inspiration edutainment YouTube channel.
          </p>
        </div>
        <div className="environment-badge" aria-label="Production system status">
          <span className="pulse-dot" aria-hidden="true" />
          Studio online
        </div>
      </header>

      <section className={styles.channelHero} aria-labelledby="channel-heading">
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}>YouTube-first animated travel channel</span>
          <h2 id="channel-heading">Kids discover the world with LEO.</h2>
          <p className={styles.heroSubline}>Parents discover where to take them.</p>
          <p className={styles.heroBody}>
            Choose a destination and the engine will research it, write the story, generate the animated episode,
            create Shorts and YouTube assets, then stop once for your approval before publishing.
          </p>

          <div className={styles.heroActions}>
            <button className={styles.primaryAction} type="button">Create Next Episode</button>
            <button className={styles.secondaryAction} type="button">Open Channel Queue</button>
          </div>

          <div className={styles.channelStats} aria-label="YouTube channel production summary">
            <div><strong>0</strong><span>Episodes</span></div>
            <div><strong>0</strong><span>Shorts</span></div>
            <div><strong>0</strong><span>Scheduled</span></div>
            <div><strong>—</strong><span>YouTube connected</span></div>
          </div>
        </div>

        <div className={styles.leoStage}>
          <span className={styles.sunGlow} aria-hidden="true" />
          <Image
            className={styles.leoImage}
            src="/leo/leo-hero.webp?v=2"
            alt="LEO, the lion cub travel explorer carrying his passport satchel"
            width={160}
            height={240}
            priority
            unoptimized
          />
          <div className={styles.leoBadge}>
            <span>HOST &amp; EXPLORER</span>
            <strong>LEO</strong>
          </div>
        </div>
      </section>

      <section className={styles.studioGrid} aria-label="LEO YouTube production studio">
        <article className={`${styles.studioCard} ${styles.nextEpisodeCard}`}>
          <span className={styles.cardLabel}>Next Episode</span>
          <h2>Where should LEO go next?</h2>
          <p>Start with a destination. Japan remains the recommended pilot.</p>
          <button className={styles.cardAction} type="button">Start Japan Pilot →</button>
        </article>

        <article className={styles.studioCard}>
          <span className={styles.cardLabel}>YouTube Publishing</span>
          <h2>Long-form + Shorts</h2>
          <p>One approved adventure becomes the full episode, Shorts, title, description, thumbnail and chapters.</p>
          <span className={styles.statusPill}>YouTube API not connected</span>
        </article>

        <article className={styles.studioCard}>
          <span className={styles.cardLabel}>LEO&apos;s Money Moment™</span>
          <h2>Local currency → USD</h2>
          <p>Every qualifying episode can teach a simple, approximate conversion while LEO buys a local item.</p>
          <div className={styles.currencyPreview}><span>¥1,500</span><span>→</span><strong>≈ $10 USD</strong></div>
        </article>

        <article className={styles.studioCard}>
          <span className={styles.cardLabel}>Parent Travel Bridge</span>
          <h2>From video inspiration to a real trip.</h2>
          <p>Each destination can also produce a parent-facing page with family experiences and travel inspiration.</p>
        </article>
      </section>

      <section className={styles.pipelineSection} aria-labelledby="pipeline-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">Automated Content Factory</p>
            <h2 id="pipeline-heading">One destination in. A YouTube content package out.</h2>
          </div>
          <span className={styles.approvalBadge}>One-click approval before publish</span>
        </div>

        <div className={styles.pipelineTrack}>
          {productionSteps.map(([number, title, description]) => (
            <article className={styles.pipelineStep} key={title}>
              <span className={styles.stepNumber}>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.channelPlan}>
        <div>
          <p className="eyebrow">Channel Programming</p>
          <h2>LEO&apos;s world of adventures</h2>
        </div>
        <div className={styles.pillarCloud}>
          <span>Countries</span><span>Languages</span><span>Airports</span><span>Cultures</span>
          <span>Geography</span><span>Food</span><span>History</span><span>Careers</span>
          <span>Money</span><span>Entrepreneurship</span><span>Activities</span><span>Stars &amp; Constellations</span>
        </div>
      </section>

      <ProviderReadiness />
    </DashboardShell>
  );
}
