import "./Experience.css";

function Experience() {
  return (
    <section id="experience" className="section-block experience-sec">
      <div className="experience-container">
        <h2 className="section-title">Experience & certifications</h2>

        <div className="experience-grid">
          <article className="experience-card">
            <div className="experience-card-header">
              <div>
                <h3 className="experience-title">Data Science Intern</h3>
                <p className="experience-subtitle">Synent</p>
              </div>
              <span className="experience-period">May – June 2026</span>
            </div>
            <ul className="experience-bullets">
              <li>Cleaned/preprocessed datasets using Python, Pandas, NumPy, Matplotlib, Seaborn</li>
              <li>Built Netflix dashboard, sales analysis, customer segmentation</li>
              <li>Built classification & regression models (heart disease, house price, loan approval)</li>
              <li>Organised all work in GitHub for reproducible review</li>
            </ul>
            <div className="experience-tags">
              <span className="experience-tag">Python</span>
              <span className="experience-tag">Pandas</span>
              <span className="experience-tag">scikit-learn</span>
              <span className="experience-tag">Matplotlib</span>
            </div>
          </article>

          <article className="experience-card">
            <h3 className="experience-title">Certifications</h3>
            <div className="cert-list">
              <div className="cert-row">
                <span className="cert-check">✓</span>
                <div className="cert-details">
                  <p className="cert-name">Machine Learning</p>
                  <p className="cert-issuer">NPTEL · Elite + Silver</p>
                </div>
              </div>
              <div className="cert-row">
                <span className="cert-check">✓</span>
                <div className="cert-details">
                  <p className="cert-name">Database Management Systems</p>
                  <p className="cert-issuer">NPTEL · Elite + Silver</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Experience;
