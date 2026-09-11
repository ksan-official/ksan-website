"use client";

import { useMemo, useState } from "react";

export function EventDetailGallery({ images, title }: { images: string[]; title: string }) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = safeImages[activeIndex] ?? safeImages[0];

  if (!activeImage) return null;

  return (
    <div className="event-detail-gallery">
      <div className="event-detail-cover" data-protected-event-image>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`${title} 행사 대표 이미지`} src={activeImage} />
      </div>
      {safeImages.length > 1 ? (
        <div className="event-detail-thumbnails" aria-label={`${title} 행사 사진 목록`}>
          {safeImages.map((image, index) => (
            <button
              aria-label={`${index + 1}번째 사진 보기`}
              aria-pressed={activeIndex === index}
              className={activeIndex === index ? "is-active" : undefined}
              key={`${image}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={image} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
