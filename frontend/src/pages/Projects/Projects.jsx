import { useEffect, useState } from "react";
import { githubUsername } from "../../data/portfolio";
import "./Projects.css";

const fallbackProjects = [
  {
    id: "fallback-1",
    name: "CHARUSAT Online Course Assistant",
    description: "RAG chatbot answering questions on CHARUSAT online programmes. Text extraction, chunking, embeddings, vector retrieval with ChromaDB. FastAPI backend, grounded responses to reduce hallucination.",
    html_url: "https://github.com/patelsavan2007-byte",
    language: "Python",
    tags: ["Python", "FastAPI", "LangChain", "ChromaDB", "RAG"],
    period: "Aug 2026–Present"
  },
  {
    id: "fallback-2",
    name: "AI Fashion Recommendation System",
    description: "Image-based recommender using ResNet50 + cosine similarity. Size estimation with MediaPipe pose detection. React frontend + Node.js APIs.",
    html_url: "https://github.com/patelsavan2007-byte",
    language: "Python",
    tags: ["Python", "ResNet50", "MediaPipe", "React.js", "Node.js"],
    period: "Feb–Apr 2026"
  },
  {
    id: "fallback-3",
    name: "AI Video Generator",
    description: "Converts user prompts to generated video (end-to-end). Interactive React frontend.",
    html_url: "https://github.com/patelsavan2007-byte",
    language: "Python",
    tags: ["Python", "Generative AI", "React.js"],
    period: "May–June 2026"
  }
];

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

  return (
    <section id="projects" className="section-block projects-sec">
      <div className="projects-container">
        <h2 className="section-title">Featured projects</h2>

        <div className="featured-projects">
          {fallbackProjects.map((project) => (
            <article key={project.id} className="featured-card">
              <div className="featured-card-header">
                <h3 className="featured-name">{project.name}</h3>
                <span className="featured-period">{project.period}</span>
              </div>
              <p className="featured-desc">{project.description}</p>
              <div className="featured-tags">
                {project.tags.map((tag, idx) => (
                  <span key={idx} className="featured-tag">{tag}</span>
                ))}
              </div>
              <div className="featured-footer">
                <a href={project.html_url} target="_blank" rel="noopener noreferrer" className="featured-link">
                  GitHub →
                </a>
              </div>
            </article>
          ))}
        </div>

        <h2 className="section-title section-title-alt">GitHub repositories</h2>

        {loading && <p className="projects-loading">Loading GitHub projects...</p>}
        {error && <p className="projects-error">{error}</p>}
        {!loading && !error && repos.length === 0 && <p className="projects-empty">No public GitHub repositories were found.</p>}

        {!loading && !error && repos.length > 0 && (
          <div className="project-grid">
            {repos.map((repo) => (
              <article key={repo.id} className="project-card">
                <div className="project-card-header">
                  <h3>{repo.name}</h3>
                </div>

                <p className="project-description">
                  {repo.description || "No description available."}
                </p>

                <div className="project-meta">
                  <span>{repo.language || "Unknown"}</span>
                  <span>★ {repo.stargazers_count}</span>
                  <span>⑂ {repo.forks_count}</span>
                </div>

                <div className="project-links">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    GitHub →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Projects;
