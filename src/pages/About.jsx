import React from "react";
import "./About.css";

function About({ info }) {
  if (!info) return null;

  return (
    <section id="about" className="section-block about-sec">
      <div className="about-container">
        <span className="section-title-tag">Who I Am</span>
        <h2 className="section-title">{info.title}</h2>
        
        <div className="about-content">
          <p className="about-bio">{info.bio}</p>
          
          <div className="about-stats-grid">
            {info.stats.map((stat, index) => (
              <div key={index} className="about-stat-card">
                <span className="stat-label">{stat.label}</span>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
