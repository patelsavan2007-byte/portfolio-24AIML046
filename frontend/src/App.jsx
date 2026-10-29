import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import "./index.css";

// Route-based code splitting using React.lazy()
const Home = lazy(() => import("./pages/Home/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const Contact = lazy(() => import("./pages/Contact"));
const Tasks = lazy(() => import("./pages/Tasks/TaskManager"));
const Login = lazy(() => import("./pages/Tasks/Auth/Login"));
const Register = lazy(() => import("./pages/Tasks/Auth/Register"));

// Meaningful fallback UI for Suspense
function PageLoader() {
  return (
    <div className="loading-fallback" id="route-loading-fallback">
      <div className="loading-spinner"></div>
      <p>Loading page...</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
