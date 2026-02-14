import Router from "preact-router";
import { useEffect, useState } from "preact/hooks";
import { getAuthStatus } from "./api";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SearchResults from "./pages/SearchResults";

function App() {
  const [email, setEmail] = useState<string | undefined>();
  const [checked, setChecked] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(window.location.pathname);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getAuthStatus()
      .then((status) => {
        if (status.authenticated) {
          setEmail(status.email);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <div class="flex min-h-screen items-center justify-center">
        <p class="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <Layout>
        <Login />
      </Layout>
    );
  }

  return (
    <Layout
      email={email}
      currentUrl={currentUrl}
      onPhraseCreated={() => setRefreshKey((k) => k + 1)}
    >
      <Router
        onChange={(e: { url: string }) => setCurrentUrl(e.url)}
      >
        <Home path="/" key={refreshKey} />
        <SearchResults path="/search" />
      </Router>
    </Layout>
  );
}

export default App;
