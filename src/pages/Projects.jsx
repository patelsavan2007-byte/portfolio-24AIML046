import React from "react";
import "./Projects.css";

function Projects({ projects = [] }) {
  if (!projects || projects.length === 0) return null;

  const statusColors = {
    "Live": { bg: "rgba(16, 185, 129, 0.12)", text: "#34d399", dot: "#10b981" },
    "In Progress": { bg: "rgba(245, 158, 11, 0.12)", text: "#fbbf24", dot: "#f59e0b" },
    "Completed": { bg: "rgba(139, 92, 246, 0.12)", text: "#a78bfa", dot: "#8b5cf6" },
  };

  return (
    <section id="projects" className="section-block projects-sec">
      <div className="projects-container">
        <span className="section-title-tag">What I've Built</span>
        <h2 className="section-title">Featured Projects</h2>
        <p className="section-desc">
          A selection of projects where I applied AI, machine learning, and full-stack development to solve real-world problems.
        </p>

        <div className="projects-grid">
          {projects.map((project, idx) => {
            const statusStyle = statusColors[project.status] || statusColors["Completed"];
            return (
              <div key={idx} className="project-card">
                {/* Card Header */}
                <div className="project-card-header">
                  <span className="project-type-label">{project.type}</span>
                  <span
                    className="project-status-badge"
                    style={{ background: statusStyle.bg, color: statusStyle.text }}
                  >
                    <span
                      className="status-dot"
                      style={{ background: statusStyle.dot }}
                    ></span>
                    {project.status}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.description}</p>

                {/* Features */}
                <ul className="project-features">
                  {project.highlights.map((feat, i) => (
                    <li key={i} className="project-feature-item">
                      <span className="feature-dot"></span>
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* Tech Stack */}
                <div className="project-tech-stack">
                  {project.tech.map((tag, i) => (
                    <span key={i} className="tech-tag">{tag}</span>
                  ))}
                </div>

                {/* Footer Link */}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link-btn"
                  >
                    View on GitHub
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Projects;
