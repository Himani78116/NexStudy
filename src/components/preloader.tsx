'use client'
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion";
import "../styles/landing.css"
import { Variants } from "framer-motion";

const text = "NexStudy";

const container: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const letter: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const Preloader = () => {
     return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-gray-100 to-white z-50"
      initial="hidden"
      animate="visible"
      exit={{
        opacity: 0,
        scale: 1.1,
        transition: { duration: 0.6 }
    }}
    >
      <motion.h1
        className="text-[2rem] sm:text-[3.5rem] md:text-9xl font-bold text-black flex gap-1 sm:gap-2 tracking-[0.15em] sm:tracking-[0.25em] md:tracking-[0.35em] drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] style text-9xl font-bold text-black flex gap-2 tracking-[0.35em] 
drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] 
[ text-shadow: 0px 2px 2px rgba(255,255,255,0.6), 0px -2px 4px rgba(0,0,0,0.2) ] style"
        variants={container}
      >
        {text.split("").map((char, i) => (
          <motion.span key={i} variants={letter}>
            {char}
          </motion.span>
        ))}
      </motion.h1>
    </motion.div>
  );
}
export default Preloader;