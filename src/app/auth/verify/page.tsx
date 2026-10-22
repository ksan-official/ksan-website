import Image from "next/image";
import Link from "next/link";
import { SignupPreview } from "../SignupPreview";
import styles from "../auth.module.css";

export default function VerificationPage() {
  return (
    <main className={styles.page} id="main">
      <section className={styles.panel} aria-labelledby="verification-title">
        <Link className={styles.brand} href="/" aria-label="KSAN 홈으로">
          <span>네덜란드에서 함께하는 우리</span>
          <Image src="/images/ksan-logo-black.png" alt="KSAN" width={1809} height={584} priority />
        </Link>
        <h1 className={styles.title} id="verification-title">신분 인증</h1>
        <SignupPreview initialStep="verify" />
        <Link className={styles.switchMode} href="/mypage/profile">프로필로 돌아가기</Link>
      </section>
    </main>
  );
}
