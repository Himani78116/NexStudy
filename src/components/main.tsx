import "../styles/landing.css"
import Image from "next/image"
import book from "../assets/book.png"

const Landing = () => {
    return(
        <main>
            <div className="box1">
                <Image src={book} alt="Logo" width={200} height={200} id="book" />
                <p id="heading">Score with Confidence</p>
                <p className="subheading">Turn confusion into clarity with organized exam-ready notes. Clarity for every topic.</p>
                <p className="subheading">No more wasted study time.</p>
                <button id="getstarted"> Get started </button>
                <p id="bottomtext">STUDY WITH NEXSTUDY</p>
            </div>
            <div className="box2">
                <p>Built for making your preparation easy!</p>
            </div>
        </main>
    )
} 

export default Landing;