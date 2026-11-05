"use client";

import { useEffect, useState } from "react";

export function ReadingMap({
  label,
  steps,
}: {
  label: string;
  steps: { id: string; index: string; label: string }[];
}) {
  const [active, setActive] = useState(steps[0]?.id ?? "");
  const ids = steps.map((step) => step.id).join("|");

  useEffect(() => {
    const nodes = steps
      .map((step) => document.getElementById(step.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-28% 0px -52% 0px", threshold: [0.15, 0.4, 0.75] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [ids, steps]);

  return (
    <nav className="shell reading-map pb-10" aria-label={label}>
      {steps.map((step) => (
        <a
          key={step.id}
          className={`reading-step${active === step.id ? " reading-step-on" : ""}`}
          href={`#${step.id}`}
          aria-current={active === step.id ? "true" : undefined}
        >
          <b>{step.index}</b>
          {step.label}
        </a>
      ))}
    </nav>
  );
}
