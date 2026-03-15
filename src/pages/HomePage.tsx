import type { CSSProperties } from "react";

interface HomePageProps {
  navigate: (path: string) => void;
}

export function HomePage({ navigate }: HomePageProps) {
  const btnStyle: CSSProperties = {
    color: "#FFD700",
    background: "transparent",
    border: "1px solid #FFD700",
    padding: "0.75rem 2.5rem",
    fontSize: "1rem",
    letterSpacing: "0.08em",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s, color 0.15s",
    width: "220px",
  };

  return (
    <div
      style={{
        backgroundColor: "#08000f",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
      }}
    >
      <a
        href="https://youtube.com/@branchstreamers?si=0VcZvyqlep5FVYuP"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <button style={btnStyle}>Video</button>
      </a>
      <a
        href="https://branchrooot.wixsite.com/root"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <button style={btnStyle}>Mūzikas teorija</button>
      </a>
      <button style={btnStyle} onClick={() => navigate("/valsts-izdevumi")}>
        Valsts izdevumi
      </button>
    </div>
  );
}
