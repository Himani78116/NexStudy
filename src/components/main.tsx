'use client'
import { useRouter } from 'next/navigation'
import "../styles/landing.css"
import Image from "next/image"
import book from "../assets/book.png"
import background from "../assets/background.jpg";

const Landing = () => {
    const router = useRouter()

    return(
        <main>
            <div style={{
                backgroundImage: `url(${background.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.73
                }} className="box1 min-h-screen">
                <Image src={book} alt="Logo" width={200} height={200} id="book" className="animated-text"/>
                <p id="heading" className="animated-text">Score with Confidence</p>
                <p className="subheading animated-text">Turn confusion into clarity with organized exam-ready notes. Clarity for every topic.</p>
                <p className="subheading animated-text">No more wasted study time.</p>
                <button id="getstarted" className="animated-text" onClick={() => router.push('/signup')}> Get started </button>
                <p id="bottomtext">STUDY WITH NEXSTUDY</p>
            </div>
            <div className="box2">
                <p>Built for making your preparation easy!</p>
            </div>
        </main>
    )
} 

export default Landing;