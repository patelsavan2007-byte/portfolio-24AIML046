import NavBar from "../navigation/NavBar";
import "./Header.css";

function Header({ brandName = "Savan Patel", onNavClick }) {
  return (
    <header className="header">
      {/* Logo */}
      <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); onNavClick("home"); }}>
        <h2>{brandName}</h2>
      </a>

      {/* Navigation */}
      <NavBar onNavClick={onNavClick} />

      {/* Button */}
      <button className="hire-btn" onClick={() => onNavClick("contact")}>
        Hire Me
      </button>
    </header>
  );
}

export default Header;