import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Global styles
import "./styles/card.css"; // Card-specific styles
import ReactGA from "react-ga4"; // Import Google Analytics

// Initialize Google Analytics with your tracking ID
ReactGA.initialize("G-ZL2N24M86V");

// Send a page view event
ReactGA.send("pageview");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
