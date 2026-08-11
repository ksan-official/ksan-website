"use client";

import { useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";

type Activity = {
  area: string;
  title: string;
  summary: string;
  description: string;
  image: string;
};

export function AboutActivityGrid({ activities }: { activities: Activity[] }) {
  const [flippedCards, setFlippedCards] = useState<string[]>([]);

  function toggleCard(title: string) {
    setFlippedCards((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title]
    );
  }

  return (
    <div className="about-activity-grid" data-activity-grid>
      {activities.map((activity) => {
        const isFlipped = flippedCards.includes(activity.title);

        return (
          <button
            aria-label={`${activity.title} ${isFlipped ? "사진 보기" : "설명 보기"}`}
            aria-pressed={isFlipped}
            className={`about-activity-card area-${activity.area}${isFlipped ? " is-flipped" : ""}`}
            data-activity-card
            key={activity.title}
            onClick={() => toggleCard(activity.title)}
            type="button"
          >
            <span className="about-card-inner">
              <span
                className="about-card-face about-card-front"
                style={{
                  backgroundImage: `linear-gradient(180deg, transparent 32%, rgba(29, 29, 31, 0.88) 100%), url(${activity.image})`
                }}
              >
                <span className="about-card-kicker">{activity.summary}</span>
                <strong>{activity.title}</strong>
                <span className="about-card-hint">
                  자세히 보기 <ArrowUpRight size={17} aria-hidden />
                </span>
              </span>
              <span className="about-card-face about-card-back">
                <span className="about-card-kicker">KSAN Program</span>
                <strong>{activity.title}</strong>
                <span className="about-card-description">{activity.description}</span>
                <span className="about-card-hint">
                  사진으로 돌아가기 <RotateCcw size={17} aria-hidden />
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
