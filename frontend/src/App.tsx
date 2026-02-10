import Router from "preact-router";
import { useEffect, useState } from "preact/hooks";
import { getAuthStatus } from "./api";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PhraseDetail from "./pages/PhraseDetail";
import PhraseForm from "./pages/PhraseForm";
import SearchResults from "./pages/SearchResults";

function App() {
  const [email, setEmail] = useState<string | undefined>();
  const [checked, setChecked] = useState(false);

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
    <Layout email={email}>
      <Router>
        <Home path="/" />
        <SearchResults path="/search" />
        <PhraseForm path="/new" />
        <PhraseDetail path="/phrases/:id" />
        <PhraseForm path="/phrases/:id/edit" />
      </Router>
    </Layout>
  );
}

export default App;
