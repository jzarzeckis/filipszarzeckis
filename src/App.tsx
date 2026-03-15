import { MazeCanvas } from "./MazeCanvas";
import { Router, Link, usePath } from "./router";
import { About } from "./pages/About";
import { Projects } from "./pages/Projects";
import { Button } from "@/components/ui/button";

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
        <nav
          style={{
            display: "flex",
            gap: "1rem",
            pointerEvents: "auto",
          }}
        >
          <Button asChild size="lg" className="bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-sm text-lg tracking-wide">
            <Link to="/about">About</Link>
          </Button>
          <Button asChild size="lg" className="bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-sm text-lg tracking-wide">
            <Link to="/projects">Projects</Link>
          </Button>
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
