import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// pages
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { Dashboard } from "./pages/Dashboard";

// components
import { ProtectedRoute } from "./components/ProtectedRoute";
import Lobby from "./pages/Lobby";
import { clearCookies } from "./lib/misc";

const Logout = () => {
  clearCookies();
  return <Navigate to="/login" />;
};

const RegisterAndLogout = () => {
  clearCookies();
  return <SignUp />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<SignIn />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/signup" element={<RegisterAndLogout />} />

        <Route path="*" element={<Lobby />} />
        <Route path="/" element={<Lobby />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
