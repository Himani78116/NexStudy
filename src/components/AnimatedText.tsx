"use client";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08, // speed between words
      delayChildren: 0.2,
    },
  },
};

const word: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export default function AnimatedText({ text, className }: any) {
  const words = text.split(" ");

  return (
    <motion.p
      variants={container}
      initial="hidden"
      animate="show"
      viewport={{ once: true, amount: 0.6 }}
      className={className}
    >
      {words.map((w: string, i: number) => (
        <motion.span
          key={i}
          variants={word}
          style={{ display: "inline-block", marginRight: "8px" }}
        >
          {w}
        </motion.span>
      ))}
    </motion.p>
  );
}