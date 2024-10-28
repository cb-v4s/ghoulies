import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// pages
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { Dashboard } from "./pages/Dashboard";

// components
import { ProtectedRoute } from "./components/ProtectedRoute";

const Logout = () => {
  localStorage.clear();
  return <Navigate to="/signin" />;
};

const RegisterAndLogout = () => {
  localStorage.clear();
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
        <Route path="/signin" element={<SignIn />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/signup" element={<RegisterAndLogout />} />
        <Route path="*" element={<Logout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
