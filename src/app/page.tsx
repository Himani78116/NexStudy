"use client";

import Navbar from "../components/navbar";
import Landing from "../components/main";
import Footer from "../components/footer";
import Preloader from "../components/preloader";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    const hasVisited = sessionStorage.getItem("hasVisited");

    if (!hasVisited) {
      sessionStorage.setItem("hasVisited", "true");
      setLoading(true);

      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Don't render anything until client mounts
  if (!mounted) return null;

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
  );
}