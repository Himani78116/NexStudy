"use client";
import type { Metadata} from "next";
import Navbar from "../components/navbar";
import Landing from "../components/main";
import Footer from "../components/footer";
import Preloader from "../components/preloader";
import {useState, useEffect} from "react";
import { AnimatePresence } from "framer-motion";

// export const metadata: Metadata = {
//   title: "NexStudy",
//   description: "Exam prep notes app",
// };

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // match animation duration

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <Preloader key="preloader" />}
      </AnimatePresence>

      {!loading && (
        <>
          <Navbar />
          <Landing />
          <Footer />
        </>
      )}
    </>
  )
}