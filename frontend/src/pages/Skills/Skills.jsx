import { useState } from "react";
import "./Skills.css";

function Skills({ categories = [] }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.title || "");

  if (!categories || categories.length === 0) return null;

  const getShortTitle = (title) => {
    if (title === "AI & Machine Learning") return "AI & ML";
    if (title === "Generative AI & RAG") return "Generative AI";
    if (title === "Computer Vision") return "Computer Vision";
    if (title === "Web & Backend") return "Web & Backend";
    if (title === "Tools & Databases") return "Tools";
    return title;
  };

  const currentCategory = categories.find(cat => cat.title === activeCategory) || categories[0];

  return (
    <section id="skills" className="section-block skills-sec">
      <div className="skills-container">
        <h2 className="section-title">Skills</h2>

        <div className="skills-tabs">
          {categories.map((category) => (
            <button
              key={category.title}
              className={`skills-tab ${activeCategory === category.title ? "active" : ""}`}
              onClick={() => setActiveCategory(category.title)}
            >
              {getShortTitle(category.title)}
            </button>
          ))}
        </div>

        <div className="skills-list">
          {currentCategory?.items.map((skill, idx) => (
            <div key={idx} className="skills-row">
              <span className="skill-name">{skill.name}</span>
              <span className={`skill-badge ${skill.rating.toLowerCase()}`}>
                {skill.rating}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Skills;
