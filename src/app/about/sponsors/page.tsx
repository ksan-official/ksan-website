import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AboutMotion } from "@/components/AboutMotion";
import { SponsorShowcase, type SponsorEntry } from "@/components/SponsorShowcase";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getSponsors() {
  if (!hasSupabaseConfig()) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("about_entries")
    .select("id,title,subtitle,body,image_url,sponsor_kind,benefits,usage_guide,cta_url")
    .eq("entry_type", "sponsor")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load sponsor entries", error.message);
    return [];
  }

  return (data ?? []) as SponsorEntry[];
}

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <main className="page about-page sponsor-page" data-about-page id="main">
      <AboutMotion />

      <section className="sponsor-hero" data-about-hero>
        <div className="sponsor-hero-copy">
          <h1>후원사 소개</h1>
          <p>
            KSAN과 함께 학생 커뮤니티를 만드는 후원사와 제휴 파트너를 소개합니다.
          </p>
        </div>
      </section>

      <section className="sponsor-slides" data-about-section>
        <SponsorShowcase sponsors={sponsors} />
      </section>

      <section className="sponsor-contact" data-about-section>
        <div>
          <h2>파트너가 되고 싶다면</h2>
          <p>학생에게 실질적인 혜택과 기회를 만들 수 있는 제휴 제안을 기다립니다.</p>
        </div>
        <Link className="button" href="/about#contact">
          문의하기 <ArrowRight aria-hidden size={18} />
        </Link>
      </section>
    </main>
  );
}
