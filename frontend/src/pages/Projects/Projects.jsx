import { useEffect, useState } from "react";
import { githubUsername } from "../../data/portfolio";
import "./Projects.css";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = githubUsername;

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        setRepos(data);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to load GitHub projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [username]);

  if (loading) {
    return (
      <section id="projects" className="section-block projects-sec">
        <div className="projects-container">
          <span className="section-title-tag">Work</span>
          <h2 className="section-title">Projects</h2>
          <p className="projects-loading">Loading GitHub projects...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="projects" className="section-block projects-sec">
        <div className="projects-container">
          <span className="section-title-tag">Work</span>
          <h2 className="section-title">Projects</h2>
          <p className="projects-error">{error}</p>
        </div>
      </section>
    );
  }

  if (!repos.length) {
    return (
      <section id="projects" className="section-block projects-sec">
        <div className="projects-container">
          <span className="section-title-tag">Work</span>
          <h2 className="section-title">Projects</h2>
          <p className="projects-empty">No public GitHub repositories were found.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="section-block projects-sec">
      <div className="projects-container">
        <span className="section-title-tag">Work</span>
        <h2 className="section-title">Projects</h2>

        <div className="project-grid">
          {repos.map((repo) => (
            <article key={repo.id} className="project-card">
              <div className="project-card-header">
                <h3>{repo.name}</h3>
                {repo.fork && <span className="project-status">Fork</span>}
              </div>

              <p className="project-description">
                {repo.description || "No description available."}
              </p>

              <div className="project-meta">
                <span>{repo.language || "Unknown"}</span>
                <span>⭐ {repo.stargazers_count}</span>
                <span>🍴 {repo.forks_count}</span>
              </div>

              <div className="project-links">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                  View GitHub
                </a>
                {repo.homepage && (
                  <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
                    Live Site
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
