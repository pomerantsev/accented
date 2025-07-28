#!/usr/bin/env node

/**
 * This script is gross, but looks like it works as expected.
 * It's meant to verify if all the links on the website work.
 */

import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
let mode;

if (args[0] === '--local') {
  mode = 'local';
} else if (args[0] === '--live') {
  mode = 'live';
} else {
  console.error('Usage: checkLinks.mjs --local | --live');
  process.exit(1);
}

// Track the dev process for cleanup
let previewProcess = null;

// Cleanup function
async function cleanup() {
  if (previewProcess && !previewProcess.killed) {
    console.log('Stopping preview process...');
    previewProcess.kill('SIGTERM');

    // Wait a bit for graceful shutdown, then force kill if needed
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (!previewProcess.killed) {
      previewProcess.kill('SIGKILL');
    }
  }
}

// Handle process exit and signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);

async function extractUrlsFromSitemap(host) {
  try {
    const response = await fetch(`${host}/sitemap-0.xml`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const sitemapContent = await response.text();

    // Find all <loc> tags and extract URLs
    const locRegex = /<loc>([^<]+)<\/loc>/g;
    const urls = [];

    let match = locRegex.exec(sitemapContent);
    while (match !== null) {
      urls.push(match[1]);
      match = locRegex.exec(sitemapContent);
    }

    return urls;
  } catch (error) {
    throw new Error(`Failed to read sitemap: ${error.message}`);
  }
}

async function runToCompletion(process, args) {
  return new Promise((resolve, reject) => {
    const spawnedProcess = spawn(process, args, {
      stdio: 'inherit',
    });

    spawnedProcess.on('close', (code) => {
      resolve(code);
    });

    spawnedProcess.on('error', (error) => {
      reject(error);
    });
  });
}

const commonLycheeArgs = [
  '--exclude',
  '/sitemap-index\.xml$',
  '--verbose',
  '--cache',
  '--max-retries',
  '3',
  '--retry-wait-time',
  '5',
];

async function runLychee(urls) {
  try {
    let exitCode;
    exitCode = await runToCompletion('lychee', [...commonLycheeArgs, ...urls]);

    if (exitCode === 0) {
      /**
       * Some of the fragment URLs are dynamic (as is the case with Github and Deque),
       * so we'll just be checking local fragment URLs (hence the "https" exclusion).
       * And yes, some links are checked twice.
       * I couldn't find a way to avoid this, but I think it's fine.
       */
      exitCode = await runToCompletion('lychee', [
        ...commonLycheeArgs,
        '--exclude',
        '^https',
        '--include-fragments',
        ...urls,
      ]);
    }
    await cleanup();
    process.exit(exitCode);
  } catch (error) {
    console.error('Error running lychee:', error.message);
    await cleanup();
    process.exit(1);
  }
}

if (mode === 'live') {
  const urls = await extractUrlsFromSitemap(`https://accented.dev`);
  await runLychee(urls);
} else if (mode === 'local') {
  try {
    previewProcess = spawn('pnpm', ['--filter', 'website', 'preview'], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    let port;

    // Monitor stdout for "Waiting"
    previewProcess.stdout.setEncoding('utf8');

    for await (const chunk of previewProcess.stdout) {
      const lines = chunk.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        console.log(line);

        const portMatch = line.match(/http:\/\/localhost:(\d+)\//);

        if (portMatch) {
          port = portMatch[1];
          console.log(`Detected port: ${port}`);

          const urls = (await extractUrlsFromSitemap(`http://localhost:${port}`)).map((url) =>
            url.replace('https://accented.dev', `http://localhost:${port}`),
          );

          await runLychee(urls);
        }
      }
    }

    // If we get here, script1 ended without printing "Waiting"
    console.error('Script1 ended without printing "Waiting"');
    process.exit(1);
  } catch (error) {
    console.error('Error:', error.message);
    await cleanup();
    process.exit(1);
  }
}
