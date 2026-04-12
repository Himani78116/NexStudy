import "../styles/landing.css";

const Navbar = () => {
    return(
        <div className="navbar">
            <div id="logo">
                <p>NexStudy</p>
            </div>
            <div className="rightside">
                <a href="#">Contact</a>
                <a href="#">?</a>
            </div>
        </div>
    )
}

export default Navbar;