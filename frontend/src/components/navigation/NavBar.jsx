import { useState, useEffect } from "react";
import { navItems } from "../../data/portfolio";
import "./NavBar.css";

function NavBar({ onNavClick }) {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let item of navItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (e, id) => {
    e.preventDefault();
    setActiveSection(id);
    if (onNavClick) {
      onNavClick(id);
    }
  };

  return (
    <nav className="navbar">
      <ul className="navbar-links">
        {navItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
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
