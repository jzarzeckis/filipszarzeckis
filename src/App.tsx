import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { ValstizdevumiPage } from "./pages/ValstizdevumiPage";

function useRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  function navigate(to: string) {
    window.history.pushState({}, "", to);
    setPath(to);
  }

  return { path, navigate };
}

export function App() {
  const { path, navigate } = useRouter();

  if (path === "/valsts-izdevumi") {
    return <ValstizdevumiPage navigate={navigate} />;
  }

  return <HomePage navigate={navigate} />;
}

export default App;
