'use client'
import { useRouter } from 'next/navigation'
import "../styles/landing.css"
import Image from "next/image"
import book from "../assets/book.png"
import background from "../assets/background7.jpg";

const Landing = () => {
    const router = useRouter()

    return(
        <main>
            <div style={{
                backgroundImage: `url(${background.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.9
                }} className="box1 min-h-screen" id="home">
                <Image src={book} alt="Logo" width={200} height={200} priority id="book" className="animated-text w-48 h-auto"/>
                <p id="heading" className="animated-text">Score with Confidence</p>
                <p className="subheading animated-text">Turn confusion into clarity with organized exam-ready notes. Clarity for every topic.</p>
                <p className="subheading animated-text">No more wasted study time.</p>
                <button id="getstarted" className="animated-text" onClick={() => router.push('/signup')}> Get started </button>
                <p id="bottomtext">STUDY WITH NEXSTUDY</p>
            </div>
            <div className="box2" id="how-it-works">
                <h2 className="working">How does NexStudy work?</h2>
                <div className='boxof2 box1of2'>
                    <div className="cardbox1"></div>
                    <div className="cardbox2"></div>
                </div>
                <div className='boxof2 box2of2'>
                    <div className="cardbox3"></div>
                    <div className="cardbox4"></div>
                </div>
                <div className='boxof2 box3of2'>
                    <div className="cardbox5"></div>
                    <div className="cardbox6"></div>
                </div>
                <div className='boxof2 box4of2'>
                    <div className="cardbox7"></div>
                    <div className="cardbox8"></div>
                </div>
            </div>
            <div className="box3" id="features">
                <p className="text1 bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">Built for making your preparation easy!</p>
                <div className="horizontal-section">
                    <div className="scroll-container">
                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>

                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>
                    </div>
                </div>
                <p className='b3bt'>Ease your preparation with NexStudy.</p>
            </div>
        </main>
    )
} 

export default Landing;