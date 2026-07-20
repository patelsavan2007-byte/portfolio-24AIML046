import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer id="contact" className="section-block contact-sec">
      <h1>Contact Section</h1>
      <p>Email: contact@example.com | Phone: +1 234 567 890</p>
      <p style={{ marginTop: "24px", fontSize: "0.85rem", opacity: 0.7 }}>
        &copy; {new Date().getFullYear()} College Practical 1. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
