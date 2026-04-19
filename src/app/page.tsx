import type { Metadata} from "next";
import Navbar from "../components/navbar";
import Landing from "../components/main";
import Footer from "../components/footer";

export const metadata: Metadata = {
  title: "NexStudy",
  description: "Exam prep notes app",
};

export default function Home() {
  return (
    <>
      <Navbar />
      <Landing />
      <Footer />

    </>
  )
}