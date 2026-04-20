'use client'
import "../styles/landing.css"

const scrollToSection = (id:string) => {
    const el = document.getElementById(id)
    if (el) {
        el.scrollIntoView({ behavior: 'smooth'})
    }
}

const Footer = () => {
    return(
        <div className="footer">
            <div className="footer1">
                <div className="f">
                    <h2 className="text-xl font-bold text-white">NexStudy</h2>
                    <p className="mt-2 text-sm">Study smarter, not harder.</p>
                </div>
                <div className="f">
                    <h3 className="font-semibold text-white">Quick Links</h3>
                    <ul className="mt-2 space-y-2">
                        <li><button className="border-none outline-none focus:outline-none shadow-none" onClick={() => scrollToSection('home')}>Home</button></li>
                        <li><button className="border-none outline-none focus:outline-none shadow-none" onClick={() => scrollToSection('features')}>Features</button></li>
                        <li><button className="border-none outline-none focus:outline-none shadow-none" onClick={() => scrollToSection('how-it-works')}>How it works?</button></li>
                    </ul>
                </div>
                <div className="f">
                    <h3 className="font-semibold text-white">Support</h3>
                    <ul className="mt-2 space-y-2">
                        <li>Contact</li>
                        <li>Help Center</li>
                    </ul>
                </div>
            </div>
            <hr className="horiz" />
            <p className="end-text">© 2026 NexStudy. All rights reserved.</p>
        </div>
    )
}

export default Footer;