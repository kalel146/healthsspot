import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ClerkProvider } from "@clerk/clerk-react";
import { ThemeProvider } from "./ThemeContext";
import "./index.css";

const clerkPubKey = "pk_test_ZmFuY3kteWFrLTE1LmNsZXJrLmFjY291bnRzLmRldiQ";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ClerkProvider>
  </React.StrictMode>
);
