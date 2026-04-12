import type { Metadata} from "next";
import Navbar from "../components/navbar";
import Landing from "../components/main";

export const metadata: Metadata = {
  title: "NextStudy",
  description: "Exam prep notes app",
};

export default function Home() {
  return (
    <>
      <Navbar />
      <Landing />
    </>
  )
}