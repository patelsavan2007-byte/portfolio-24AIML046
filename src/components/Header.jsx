import React from "react";
import "./Header.css";

function Header() {
  return (
    <header className="header">
      {/* Logo */}
      <div className="logo">
        <h2>My Portfolio</h2>
      </div>

      {/* Navigation */}
      <nav>
        <ul className="nav-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Skills</a></li>
          <li><a href="#">Projects</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>

      {/* Button */}
      <button className="btn">Hire Me</button>
    </header>
  );
}

export default Header;