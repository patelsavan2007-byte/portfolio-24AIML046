import React, { useState } from "react";
import "./NavBar.css";

const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" }
];

function NavBar() {
  const [activeSection, setActiveSection] = useState("home");

  const handleClick = (e, id) => {
    e.preventDefault();
    setActiveSection(id);
  };

  return (
    <nav className="navbar">
      <ul className="navbar-links">
        {navItems.map((item) => (
          <li key={item.id}>
            <a
              href="#"
              className={`navbar-link ${activeSection === item.id ? "active" : ""}`}
              onClick={(e) => handleClick(e, item.id)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavBar;
