import { createRoot } from 'react-dom/client'
import './index.css'

console.log("main.tsx starting import chain...");

import('./App.tsx')
  .then((module) => {
    console.log("App.tsx module loaded successfully!");
    const App = module.default;
    const root = document.getElementById('root');
    if (root) {
      createRoot(root).render(<App />);
    }
  })
  .catch((err) => {
    console.error("App.tsx load failed:", err);
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="color: #f43f5e; padding: 40px; font-family: monospace; font-size: 14px; text-align: left; max-width: 600px; margin: auto;">
          <h2 style="font-weight: bold; margin-bottom: 10px;">Vite Import Error:</h2>
          <pre style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap;">${err.stack || err.message || err}</pre>
        </div>
      `;
    }
  });
