"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function HeroMark() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, 36]);

  return (
    <motion.div
      className="hero-art"
      style={reduce ? undefined : { y }}
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="brand-frame">
        <Image
          src="/brand/athar-logo.jpg"
          alt="أثر ATHAR"
          width={974}
          height={1024}
          priority
          className="brand-lockup"
        />
      </div>
    </motion.div>
  );
}
