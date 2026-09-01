import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import About from "../About/About";
import Skills from "../Skills/Skills";
import Projects from "../Projects/Projects";
import Contact from "../Contact/Contact";
import {
  brandName,
  themeColor,
  aboutInfo,
  skillCategories,
} from "../../data/portfolio";

function Home() {
  const navigate = useNavigate();

  const handleScrollTo = (id) => {
    if (id === "tasks") {
      navigate("/tasks");
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="app-container">
      <Header brandName={brandName} themeColor={themeColor} onNavClick={handleScrollTo} />

      <main>
        <section id="home" className="section-block home-sec">
          <div className="hero-content">
            <h1 className="hero-name">{brandName}</h1>
            <p className="hero-subtitle">AI &amp; ML Developer | 3rd Year AIML Student</p>
            <p className="hero-desc">
              Could intelligent systems enable dynamic applications — from machine learning models and backend systems to the client interfaces? That's what I build.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => handleScrollTo("contact")}>
                Get in Touch
              </button>
              <button className="btn-secondary" onClick={() => handleScrollTo("projects")}>
                View Projects
              </button>
            </div>
          </div>
        </section>

        <About info={aboutInfo} />
        <Skills categories={skillCategories} />
        <Projects />
        <section id="tasks" className="section-block">
          <div className="tasks-card">
            <span className="section-title-tag">Interactive Demo</span>
            <h2 className="section-title">Task Manager</h2>
            <p className="section-desc">
              A full-stack CRUD app I built with React, Express, and MongoDB.
              Create, organize, and manage your tasks with authentication.
            </p>
            <button className="btn-primary" onClick={() => navigate("/tasks")}>
              Open Task Manager
            </button>
          </div>
        </section>
        <Contact />
      </main>

      <Footer brandName={brandName} onNavClick={handleScrollTo} />
    </div>
  );
}

export default Home;
