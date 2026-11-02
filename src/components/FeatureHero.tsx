import type { ReactNode } from "react";
import { HomeSectionIcon } from "@/components/HomeSectionIcon";
import styles from "./FeatureHero.module.css";

type FeatureKind = Parameters<typeof HomeSectionIcon>[0]["kind"];

type FeatureHeroProps = {
  kind: FeatureKind;
  eyebrow: string;
  title: ReactNode;
  titleId: string;
  description?: ReactNode;
  children?: ReactNode;
  motion?: "business" | "events" | "market";
};

export function FeatureHero({ kind, eyebrow, title, titleId, description, children, motion }: FeatureHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby={titleId} data-feature-hero={kind}
      data-business-hero={motion === "business" ? "" : undefined}
      data-market-hero={motion === "market" ? "" : undefined}>
      <div className={styles.copy} data-events-intro={motion === "events" ? "" : undefined}>
        <p className={styles.kicker}>{eyebrow}</p>
        <h1 className={styles.title} id={titleId}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {children && <div className={styles.actions}>{children}</div>}
      </div>
      <div className={styles.art} data-feature-hero-art={kind} aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.blob} />
        <span className={styles.shadow} />
        <span className={styles.icon}><HomeSectionIcon kind={kind} /></span>
        <svg className={styles.sparkle} viewBox="0 0 32 32" fill="none" focusable="false">
          <path d="M16 2c1.2 9 5 12.8 14 14-9 1.2-12.8 5-14 14C14.8 21 11 17.2 2 16 11 14.8 14.8 11 16 2Z" fill="currentColor" />
        </svg>
        <svg className={styles.smallSparkle} viewBox="0 0 24 24" fill="none" focusable="false">
          <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className={styles.dot} />
        <span className={styles.ring} />
      </div>
    </section>
  );
}
