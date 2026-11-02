import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AmsterdamSpotMap } from "@/components/AmsterdamSpotMap";
import { FeatureHero } from "@/components/FeatureHero";
import styles from "./SpotsPage.module.css";

export const metadata = { title: "네덜란드 스팟 | KSAN" };

export default function SpotsPage() {
  return (
    <main id="main" className={styles.page}>
      <Link href="/guides" className={styles.back}><ArrowLeft size={16} aria-hidden />정착가이드</Link>
      <FeatureHero kind="map" eyebrow="네덜란드 스팟" titleId="spots-title"
        title={<>학생의 하루가 더 즐거워지는<br />네덜란드 스팟</>} />
      <div className={styles.mapContent}><AmsterdamSpotMap hideIntro /></div>
    </main>
  );
}
