import React from "react";
import Header from "./components/Header";
import "./App.css";

function App() {
  // Simple primary theme color (blue) for the Header
  const themeColor = "#2563eb";

  return (
    <div className="app-container">
      <Header themeColor={themeColor} />

      <main>
        <section id="home" className="section-block home-sec">
          <h1>Home Section</h1>
          <p>Welcome to the home page of College Practical 1.</p>
        </section>
      </main>
    </div>
  );
}

export default App;
