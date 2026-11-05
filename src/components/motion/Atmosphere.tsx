"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function Atmosphere() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const gold = useTransform(scrollY, [0, 1400], [0, 90]);
  const sky = useTransform(scrollY, [0, 1400], [0, -70]);
  const leaf = useTransform(scrollY, [0, 1800], [20, -40]);

  return (
    <div className="atmosphere" aria-hidden="true">
      <motion.span className="orb orb-gold" style={reduce ? undefined : { y: gold }} />
      <motion.span className="orb orb-sky" style={reduce ? undefined : { y: sky }} />
      <motion.span className="orb orb-leaf" style={reduce ? undefined : { y: leaf }} />
    </div>
  );
}
