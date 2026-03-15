import { MazeCanvas } from "./MazeCanvas";
import { Router, Link, usePath } from "./router";
import { About } from "./pages/About";
import { Projects } from "./pages/Projects";

function HomePage() {
  return (
    <>
      <MazeCanvas />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: "clamp(2rem, 6vw, 4rem)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            margin: 0,
          }}
        >
          Filip Szarzeckis
        </h1>
        <nav
          style={{
            display: "flex",
            gap: "2rem",
            pointerEvents: "auto",
          }}
        >
          <Link
            to="/about"
            className="text-white/70 hover:text-white transition-colors text-lg tracking-wide"
          >
            About
          </Link>
          <Link
            to="/projects"
            className="text-white/70 hover:text-white transition-colors text-lg tracking-wide"
          >
            Projects
          </Link>
        </nav>
      </div>
    </>
  );
}

function Routes() {
  const path = usePath();
  if (path === "/about") return <About />;
  if (path === "/projects") return <Projects />;
  return <HomePage />;
}

export function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}

export default App;
