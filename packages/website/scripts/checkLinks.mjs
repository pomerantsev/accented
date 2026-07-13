#!/usr/bin/env node

/**
 * This script is gross, but looks like it works as expected.
 * It's meant to verify if all the links on the website work.
 */

import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';

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

async function runToCompletion(process, processArgs) {
  return new Promise((resolve, reject) => {
    const spawnedProcess = spawn(process, processArgs, {
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
  '/sitemap-index.xml$',
  '--exclude',
  '^https://www.npmjs.com/', // npmjs.com enabled Cloudflare security, which blocks curl requests
  '--exclude',
  '^https://stackoverflow.com/', // stackoverflow did something similar
  '--verbose',
  '--cache',
  '--max-retries',
  '3',
  '--retry-wait-time',
  '5',
  // Netlify's Image CDN (/.netlify/images) generates responsive srcset variants
  // on demand; a cold transform can take longer than lychee's default 20s timeout.
  '--timeout',
  '60',
  '--max-concurrency',
  '1',
  // Use GitHub token if available
  ...(process.env.GITHUB_TOKEN ? ['--github-token', process.env.GITHUB_TOKEN] : []),
];

// A single full link check: the main pass, then (if it passed) the fragment pass.
async function runLycheeOnce(urls) {
  let exitCode = await runToCompletion('lychee', [...commonLycheeArgs, ...urls]);

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

  return exitCode;
}

/**
 * The live site is served by Netlify, and requests from CI runners intermittently
 * hit transient "Connection failed" / "Timeout" errors (most often on the heavy
 * on-demand /.netlify/images transforms, but ordinary pages too) even though the
 * resources are healthy. A fresh full run almost always clears a one-off blip, so
 * we retry the whole check a few times and only fail the job if every attempt fails.
 */
const maxAttempts = 3;
const retryWaitMs = 30_000;
const lycheeCacheFile = '.lycheecache';

async function runLychee(urls) {
  try {
    let exitCode;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Drop lychee's on-disk cache between attempts so a cached failure from a
      // previous attempt isn't replayed instead of being re-fetched.
      await rm(lycheeCacheFile, { force: true });

      exitCode = await runLycheeOnce(urls);

      if (exitCode === 0) {
        break;
      }

      if (attempt < maxAttempts) {
        console.log(
          `Link check attempt ${attempt}/${maxAttempts} failed (exit code ${exitCode}); retrying in ${retryWaitMs / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryWaitMs));
      }
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
