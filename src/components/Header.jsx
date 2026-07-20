import React from "react";
import NavBar from "./NavBar";
import "./Header.css";

function Header({ themeColor }) {
  const headerStyle = themeColor ? { backgroundColor: themeColor } : {};

  return (
    <header className="header" style={headerStyle}>
      {/* Logo */}
      <div className="logo">
        <h2>My Portfolio</h2>
      </div>

      {/* Navigation */}
      <NavBar />

      {/* Button */}
      <button 
        className="btn"
        style={themeColor ? { backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.3)" } : {}}
      >
        Hire Me
      </button>
    </header>
  );
}

export default Header;