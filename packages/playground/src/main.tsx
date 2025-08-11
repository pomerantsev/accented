import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

/**
 * Integrating Accented into your project is as simple as importing it and running it with no arguments.
 *
 * How to use Accented:
 * * click one of the square buttons that are added by Accented;
 * * see what the issue is and locate it in the source code;
 * * fix it and see the Accented outline and button disappear;
 * * repeat with other issues.
 *
 * You can use this application as your personal playground.
 * The original one will automatically get forked if you start editing the code.
 *
 * Learn more:
 * * Installation and usage: https://accented.dev/getting-started
 * * Full API: https://accented.dev/api
 */
if (import.meta.env.MODE === 'development') {
  const { accented } = await import('accented');
  accented();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
