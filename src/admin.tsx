import React from "react";
import ReactDOM from "react-dom/client";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";
import "./index.css";

function AdminRoot() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AdminPage /> : <LoginPage />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AdminRoot />
  </React.StrictMode>
);