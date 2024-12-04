#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const distDir = path.dirname(__filename) + '/../dist';

async function processFile(filePath) {
  // Read the file content
  const content = await fs.readFile(filePath, 'utf8');

  // Replace import/export statements to add `.js` extension
  const updatedContent = content.replace(/(\bfrom\s+["']\..*)(["'])/g, '$1.js$2');

  // Write the updated content back to the same file
  await fs.writeFile(filePath, updatedContent, 'utf8');
  console.log(`Updated: ${filePath}`);
}

async function processDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, {withFileTypes: true});
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(entryPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      // Process .js files
      await processFile(entryPath);
    }
  }
}

try {
  await fs.access(distDir, fs.constants.R_OK | fs.constants.W_OK);
  await processDirectory(distDir);
  console.log('.js extension added to all import statements.');
} catch {
  console.error(`Directory "${distDir}" does not exist.`);
}
