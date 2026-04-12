import "../styles/landing.css";

const Navbar = () => {
    return(
        <div className="navbar">
            <div id="logo">
                <p>NexStudy</p>
            </div>
            <div className="rightside">
                <button className="navbtn" id="nbtn1">Log in</button>
                <button className="navbtn" id="nbtn2">Sign in</button>
            </div>
        </div>
    )
}

export default Navbar;