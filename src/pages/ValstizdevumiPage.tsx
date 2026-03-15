interface ValstizdevumiPageProps {
  navigate: (path: string) => void;
}

export function ValstizdevumiPage({ navigate }: ValstizdevumiPageProps) {
  return (
    <div
      style={{
        backgroundColor: "#08000f",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        color: "#FFD700",
        fontFamily: "inherit",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", letterSpacing: "0.1em", margin: 0 }}>
        Valsts izdevumi
      </h1>
      <button
        onClick={() => navigate("/")}
        style={{
          color: "#FFD700",
          background: "transparent",
          border: "1px solid #FFD700",
          padding: "0.5rem 1.5rem",
          fontSize: "0.875rem",
          letterSpacing: "0.08em",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        ← Atpakaļ
      </button>
    </div>
  );
}
