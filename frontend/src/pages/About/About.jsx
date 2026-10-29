import "./About.css";

function About({ info }) {
  if (!info) return null;

  return (
    <section id="about" className="section-block about-sec">
      <div className="about-container">
        <h2 className="section-title">About me</h2>
        
        <div className="about-content">
          <div className="about-left">
            <p className="about-bio">{info.bio}</p>
            <div className="about-highlight">
              <span>Currently: Data Science Intern @ Synent · Pandas · scikit-learn · Matplotlib</span>
            </div>
          </div>
          
          <div className="about-stats-grid">
            {info.stats.map((stat, index) => (
              <div key={index} className="about-stat-card">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
