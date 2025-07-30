const defaultButtonText = 'Copy';

class CopyCodeElement extends HTMLElement {
  connectedCallback() {
    this.style.position = 'relative';
    this.style.display = 'block';
    // Create the button element
    const button = document.createElement('button');
    button.className = 'copy';
    button.textContent = defaultButtonText;

    // Add click handler to copy text content
    button.addEventListener('click', async () => {
      // Get all text content excluding the button
      const textContent = Array.from(this.childNodes)
        .filter((node) => node !== button)
        .map((node) => node.textContent || '')
        .join('')
        .trim();

      try {
        // Copy to clipboard
        await navigator.clipboard.writeText(textContent);
        button.textContent = '✓ Copied!';
      } catch {
        button.textContent = 'Unable to copy';
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      button.textContent = defaultButtonText;
    });

    // Insert the button after all existing children
    this.insertAdjacentElement('afterbegin', button);
  }
}

// Define the custom element
customElements.define('copy-code', CopyCodeElement);
