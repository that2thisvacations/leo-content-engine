import Image from "next/image";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProviderReadiness } from "@/components/dashboard/provider-readiness";
import { dashboardMetrics } from "@/lib/dashboard";

import styles from "./page.module.css";

const journey = [
  ["01", "Research", "Destination facts, culture, family experiences"],
  ["02", "Script", "LEO story, learning moments, signature close"],
  ["03", "Storyboard", "Scenes, wardrobe, local guides, visual plan"],
  ["04", "Generate", "Video, voice, captions, music, transitions"],
  ["05", "Review", "Culture, safety, facts, character consistency"],
  ["06", "Publish", "YouTube, Shorts, parent travel page"],
] as const;

export default function DashboardPage() {
  return (
    <DashboardShell>
      <header className={styles.topbar}>
        <div>
          <p className="eyebrow">LEO Content Engine</p>
          <h1>Where should we explore next?</h1>
          <p className="page-subtitle">
            Kids discover the world. Parents discover where to take them.
          </p>
        </div>
        <div className="environment-badge" aria-label="Foundation system status">
          <span className="pulse-dot" aria-hidden="true" />
          Production online
        </div>
      </header>

      <section className={styles.adventureHero} aria-labelledby="adventure-heading">
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}>Travel-Inspiration Edutainment</span>
          <h2 id="adventure-heading">Turn one destination into LEO&apos;s next adventure.</h2>
          <p>
            Research the place, build the story, generate the episode, review it once,
            then publish the full family-travel content package.
          </p>

          <div className={styles.heroActions}>
            <button className={styles.primaryAction} type="button">Create Adventure</button>
            <button className={styles.secondaryAction} type="button">View Production Journey</button>
          </div>

          <div className={styles.heroStats} aria-label="Pipeline summary">
            {dashboardMetrics.map((metric) => (
              <div className={styles.heroStat} key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.leoStage} aria-label="LEO, the trusted travel companion">
          <span className={`${styles.orbit} ${styles.orbitOne}`} aria-hidden="true">✈</span>
          <span className={`${styles.orbit} ${styles.orbitTwo}`} aria-hidden="true">★</span>
          <span className={`${styles.orbit} ${styles.orbitThree}`} aria-hidden="true">◎</span>
          <span className={styles.tailGlow} aria-hidden="true" />
          <Image
            className={styles.leoImage}
            src="/leo/leo-hero.png"
            alt="LEO, the lion cub travel companion wearing explorer gear and carrying his passport satchel"
            width={512}
            height={768}
            priority
            sizes="(max-width: 672px) 260px, (max-width: 1248px) 320px, 390px"
          />
          <div className={styles.nextStopCard}>
            <span>LEO&apos;S NEXT STOP</span>
            <strong>Choose a destination</strong>
          </div>
        </div>
      </section>

      <section className={styles.quickGrid} aria-label="LEO content engine overview">
        <article className={`${styles.featurePanel} ${styles.passportPanel}`}>
          <span className={styles.featureLabel}>LEO&apos;s Passport</span>
          <h2>0 destinations explored</h2>
          <p>Every completed adventure adds a destination, story, souvenir and learning record.</p>
          <div className={styles.passportStamps} aria-hidden="true">
            <span>JP</span><span>EG</span><span>KE</span><span>IT</span>
          </div>
        </article>

        <article className={styles.featurePanel}>
          <span className={styles.featureLabel}>Money Moment™</span>
          <h2>Local currency → USD</h2>
          <p>LEO buys a destination-relevant item and learns a simple, approximate USD conversion.</p>
          <div className={styles.currencyPreview}>
            <span>¥1,500</span><span>→</span><strong>≈ $10 USD</strong>
          </div>
        </article>

        <article className={styles.featurePanel}>
          <span className={styles.featureLabel}>Parent Travel Bridge</span>
          <h2>Watch it. Learn it. Experience it.</h2>
          <p>Each published episode can create a family-facing travel page for the same destination.</p>
          <button className={styles.textAction} type="button">Parent pages →</button>
        </article>
      </section>

      <section className={styles.journeySection} id="production-journey" aria-labelledby="journey-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">The LEO Adventure Loop™</p>
            <h2 id="journey-heading">Production Journey</h2>
            <p>One automated path from destination idea to published family-travel inspiration.</p>
          </div>
          <span className={styles.journeyStatus}>Human approval before publish</span>
        </div>

        <div className={styles.journeyTrack}>
          {journey.map(([number, title, description]) => (
            <article className={styles.journeyStep} key={title}>
              <span className={styles.journeyNumber}>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <article className={styles.libraryPanel}>
          <div>
            <p className="eyebrow">Adventure Library</p>
            <h2>LEO&apos;s world starts here.</h2>
            <p>No episodes yet. Japan remains the recommended first pilot.</p>
          </div>
          <button className={`${styles.primaryAction} ${styles.compact}`} type="button">Start Japan Pilot</button>
        </article>

        <article className={`${styles.libraryPanel} ${styles.constellationPanel}`}>
          <div>
            <p className="eyebrow">Specialty Lane</p>
            <h2>Stars, Skies &amp; Zodiac Adventures</h2>
            <p>Astronomy, constellations, eclipses, auroras, dark-sky travel and cultural sky stories.</p>
          </div>
          <span className={styles.constellationMark} aria-hidden="true">♌</span>
        </article>
      </section>

      <ProviderReadiness />
    </DashboardShell>
  );
}
