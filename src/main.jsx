import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import { UnsavedChangesProvider } from "./UnsavedChangesContext.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UnsavedChangesProvider>
          <App />
        </UnsavedChangesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
