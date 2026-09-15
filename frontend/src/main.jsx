// Safeguard for React 19 resource timing edge-cases (prevents reading 'startTime' on undefined/malformed performance entries)
if (typeof window !== "undefined" && window.performance && typeof window.performance.getEntriesByType === "function") {
  const originalGetEntriesByType = window.performance.getEntriesByType.bind(window.performance);
  window.performance.getEntriesByType = function (type) {
    try {
      const entries = originalGetEntriesByType(type);
      if (type === "resource" && Array.isArray(entries)) {
        return entries.filter(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            typeof entry.startTime === "number" &&
            typeof entry.responseEnd === "number"
        );
      }
      return entries;
    } catch (e) {
      console.warn("Safeguard handled performance.getEntriesByType:", e);
      return [];
    }
  };
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

