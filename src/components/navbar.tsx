'use client'
import { useRouter } from 'next/navigation'
import "../styles/landing.css";

const Navbar = () => {
    const router = useRouter()

    return(
        <div className="navbar">
            <div id="logo">
                <p>NexStudy</p>
            </div>
            <div className="rightside">
                <button className="navbtn" id="nbtn1" onClick={() => router.push('/login')}>Log in</button>
                <button className="navbtn" id="nbtn2" onClick={() => router.push('/signup')}>Sign Up</button>
            </div>
        </div>
    )
}

export default Navbar;