"use client";

import { motion, useReducedMotion, useScroll } from "motion/react";

export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  if (reduce) return null;

  return <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />;
}
