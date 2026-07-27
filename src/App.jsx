import React from "react";
import Header from "./components/Header";
import About from "./pages/About";
import Skills from "./pages/Skills";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import Footer from "./pages/Footer";
import "./App.css";

function App() {
  const brandName = "Savan Patel";
  const themeColor = "#8b5cf6"; // Violet primary accent

  const aboutInfo = {
    title: "AI Developer, Student",
    bio: "Hey there! I'm Savan Patel, an AIML student passionate about turning data into intelligent, actionable models. Currently in my 3rd year of pursuing B.Tech in Artificial Intelligence & Machine Learning, I specialize in building end-to-end machine learning pipelines, training deep learning neural networks, and developing clean APIs for model deployments.",
    stats: [
      { label: "Location", value: "Vadodara, India" },
      { label: "Education", value: "B.Tech AIML (3rd Year)" },
      { label: "Profile", value: "AI / ML / Deep Learning" },
      { label: "Availability", value: "Open to Internships" }
    ]
  };

  const skillCategories = [
    {
      title: "AI & Machine Learning",
      items: [
        { name: "PyTorch", rating: "Expert" },
        { name: "Machine Learning", rating: "Expert" },
        { name: "Deep Learning", rating: "Advanced" },
        { name: "scikit-learn", rating: "Expert" },
        { name: "Pandas / NumPy", rating: "Expert" },
        { name: "Data Analytics", rating: "Advanced" }
      ]
    },
    {
      title: "Backend & Development",
      items: [
        { name: "Python", rating: "Expert" },
        { name: "SQL", rating: "Advanced" },
        { name: "REST APIs", rating: "Advanced" },
        { name: "PostgreSQL", rating: "Intermediate" },
        { name: "React & HTML/CSS", rating: "Intermediate" },
        { name: "Git & GitHub", rating: "Advanced" }
      ]
    }
  ];


  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="app-container">
      {/* Header receives Brand name and Theme color as props */}
      <Header brandName={brandName} themeColor={themeColor} onNavClick={handleScrollTo} />

      <main>
        {/* Home / Hero Section */}
        <section id="home" className="section-block home-sec">
          <div className="hero-content">
            <h1 className="hero-name">Savan Patel</h1>
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

        {/* About Component receives aboutInfo details as a prop */}
        <About info={aboutInfo} />

        {/* Skills Component receives skillCategories details as a prop */}
        <Skills categories={skillCategories} />

        {/* Projects Component fetches public GitHub repos directly */}
        <Projects />

        {/* Contact Section */}
        <Contact name={brandName} />
      </main>

      {/* Footer receives Brand name as a prop */}
      <Footer brandName={brandName} onNavClick={handleScrollTo} />
    </div>
  );
}

export default App;

