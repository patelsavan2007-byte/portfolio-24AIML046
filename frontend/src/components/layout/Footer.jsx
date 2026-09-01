import "./Footer.css";

function Footer({ brandName = "Savan Patel", onNavClick }) {
  const handleLinkClick = (e, targetId) => {
    e.preventDefault();
    if (onNavClick) {
      onNavClick(targetId);
    }
  };

  return (
    <footer className="footer-sec">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-col brand-col">
            <h3 className="footer-logo">{brandName}</h3>
            <p className="footer-desc-text">
              Focused on building intelligent machine learning systems, training neural models, and developing clean client interfaces.
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="footer-col links-col">
            <h4 className="col-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => handleLinkClick(e, "home")}>Home</a></li>
              <li><a href="#about" onClick={(e) => handleLinkClick(e, "about")}>About</a></li>
              <li><a href="#skills" onClick={(e) => handleLinkClick(e, "skills")}>Skills</a></li>
              <li><a href="#projects" onClick={(e) => handleLinkClick(e, "projects")}>Projects</a></li>
              <li><a href="#contact" onClick={(e) => handleLinkClick(e, "contact")}>Contact</a></li>
            </ul>
          </div>

          {/* Connect Section */}
          <div className="footer-col connect-col">
            <h4 className="col-title">Connect</h4>
            <ul className="footer-connect-list">
              <li>
                <span className="connect-label">Email:</span>
                <a href="mailto:patelsavan2007@gmail.com" className="connect-link">patelsavan2007@gmail.com</a>
              </li>
              <li>
                <span className="connect-label">GitHub:</span>
                <a href="https://github.com/patelsavan2007-byte" target="_blank" rel="noopener noreferrer" className="connect-link">github.com/patelsavan2007-byte</a>
              </li>
              <li>
                <span className="connect-label">LinkedIn:</span>
                <a href="https://linkedin.com/in/savanpatel" target="_blank" rel="noopener noreferrer" className="connect-link">linkedin.com/in/savanpatel</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <p className="credit">
            AIML 3rd Year Student Portfolio
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
