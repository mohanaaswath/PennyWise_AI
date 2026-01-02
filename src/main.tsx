import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved settings on initial load
const applyInitialSettings = () => {
  const appearance = localStorage.getItem('appearance') || 'dark';
  const root = document.documentElement;
  
  if (appearance === 'light') {
    root.classList.remove('dark');
  } else if (appearance === 'dark') {
    root.classList.add('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  const language = localStorage.getItem('language');
  if (language && language !== 'auto') {
    document.documentElement.lang = language;
  }
};

applyInitialSettings();

createRoot(document.getElementById("root")!).render(<App />);
