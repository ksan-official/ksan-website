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
        <HomeSectionIcon kind={kind} />
      </div>
    </section>
  );
}
