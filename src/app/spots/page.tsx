import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AmsterdamSpotMap } from "@/components/AmsterdamSpotMap";

export const metadata = { title: "네덜란드 스팟 | KSAN" };

export default function SpotsPage() {
  return (
    <main id="main" style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 22px 80px" }}>
      <Link href="/guides" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#686961", textDecoration: "none", marginBottom: 16 }}><ArrowLeft size={16} aria-hidden />정착가이드</Link>
      <AmsterdamSpotMap />
    </main>
  );
}
