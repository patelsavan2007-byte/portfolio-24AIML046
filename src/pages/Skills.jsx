import React from "react";
import "./Skills.css";

function Skills({ skills = [] }) {
  return (
    <section id="skills" className="section-block skills-sec">
      <h1>Skills Section</h1>
      <p>Skills dynamically rendered from props:</p>
      <ul className="skills-list">
        {skills.map((skill, index) => (
          <li key={index} className="skill-item">
            {skill}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Skills;
