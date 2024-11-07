import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// pages
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { Dashboard } from "./pages/Dashboard";
import { Room } from "./pages/Room";

// components
import { ProtectedRoute } from "./components/ProtectedRoute";
import MainLayout from "./layouts/Main";
import IsoWorld from "./pages/IsoWorld";

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
        <Route path="/" element={
          <MainLayout>
            <Room />
          </MainLayout>
        } />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/signup" element={<RegisterAndLogout />} />
        <Route path="*" element={<Logout />} />

        <Route path="/isoworld" element={<IsoWorld viewportWidth={640} viewportHeight={480} tileSheetURI={"https://assets.codepen.io/6201207/codepen-iso-tilesheet.png"}  />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
