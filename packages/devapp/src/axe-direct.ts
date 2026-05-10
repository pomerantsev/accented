import axe from 'axe-core';

declare global {
  interface Window {
    axe: typeof axe;
  }
}

window.axe = axe;
