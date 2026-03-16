import { Router, usePath } from "./router";
import { HomePage } from "./pages/HomePage";
import { ValstizdevumiPage } from "./pages/ValstizdevumiPage";

function Routes() {
  const path = usePath();
  if (path === "/valsts-izdevumi") return <ValstizdevumiPage />;
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
