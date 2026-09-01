import "./Skills.css";

function Skills({ categories = [] }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section id="skills" className="section-block skills-sec">
      <div className="skills-container">
        <span className="section-title-tag">What I Know</span>
        <h2 className="section-title">My Skills & Expertise</h2>
        <p className="section-desc">
          From training machine learning models and building intelligent pipelines to deploying APIs and crafting detail-rich web frontends — here's my full toolkit.
        </p>

        <div className="skills-grid">
          {categories.map((category, catIdx) => (
            <div key={catIdx} className="skills-category-card">
              <h3 className="category-title">{category.title}</h3>
              
              <div className="skills-items-grid">
                {category.items.map((skill, skillIdx) => (
                  <div key={skillIdx} className="skill-card-item">
                    <div className="skill-bullet-wrapper">
                      {/* Premium AI/ML styled icon */}
                      <svg className="skill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                    </div>
                    <div className="skill-details">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-rating">{skill.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Skills;
