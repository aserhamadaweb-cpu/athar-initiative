"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function OpeningMark() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setGone(true);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      document.body.style.overflow = previous;
      setGone(true);
    }, 3600);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, []);

  if (gone) return null;

  return (
    <div className="opening" aria-hidden="true">
      <div className="opening-stage">
        <span className="opening-glow" />
        <span className="opening-ring" />
        <span className="opening-spark opening-spark-a" />
        <span className="opening-spark opening-spark-b" />
        <span className="opening-spark opening-spark-c" />
        <div className="brand-frame opening-logo">
          <Image
            src="/brand/athar-logo.jpg"
            alt=""
            width={974}
            height={1024}
            priority
            className="brand-lockup"
          />
        </div>
        <span className="opening-line" />
        <p className="opening-credit">
          <span>powered by</span>
          <strong>ASER HAMADA</strong>
        </p>
      </div>
    </div>
  );
}
