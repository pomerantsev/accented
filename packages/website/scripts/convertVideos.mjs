#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: convertVideos.mjs <video-file1> [video-file2] ...');
  process.exit(1);
}

async function runToCompletion(command, commandArgs) {
  return new Promise((promiseResolve, reject) => {
    const spawnedProcess = spawn(command, commandArgs, {
      stdio: 'inherit',
    });

    spawnedProcess.on('close', (code) => {
      promiseResolve(code);
    });

    spawnedProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function convertVideo(inputPath) {
  const resolvedPath = resolve(inputPath);

  if (!existsSync(resolvedPath)) {
    console.error(`File does not exist: ${inputPath}`);
    return false;
  }

  // Remove file extension to create base name for output files
  const baseName = resolvedPath.replace(/\.[^/.]+$/, '');

  console.log(`Converting ${inputPath}...`);

  try {
    // Convert to webm using VP9 codec for optimal web compression
    // Note: ffmpeg args are LLM-generated
    const webmExitCode = await runToCompletion('ffmpeg', [
      '-i',
      resolvedPath, // Input file
      '-c:v',
      'libvpx-vp9', // VP9 codec for better compression than VP8
      '-b:v',
      '0', // Variable bitrate mode (uses CRF instead of fixed bitrate)
      '-crf',
      '34', // Constant Rate Factor: 34 balances quality vs file size for web
      '-cpu-used',
      '2', // Encoding speed vs quality tradeoff (0=slowest/best, 8=fastest/worst)
      '-row-mt',
      '1', // Enable row-based multithreading for faster encoding
      '-tile-columns',
      '2', // Split frame into 4 tiles (2^2) for parallel processing
      '-g',
      '300', // Keyframe interval: place keyframe every 300 frames (10 seconds at 30fps) — short videos will have one keyframe, which should be fine
      '-r',
      '30', // Output framerate: 30fps for smooth web video
      '-pix_fmt',
      'yuv420p', // Pixel format for wide browser compatibility
      `${baseName}.webm`,
    ]);

    if (webmExitCode !== 0) {
      console.error(`Failed to convert ${inputPath} to webm`);
      return false;
    }

    // Extract poster frame as WebP image for video thumbnail
    // Note: ffmpeg args are LLM-generated
    const posterExitCode = await runToCompletion('ffmpeg', [
      '-i',
      resolvedPath, // Input file
      '-ss',
      '0', // Extract frame from the very beginning of the video
      '-frames:v',
      '1', // Extract exactly one video frame
      '-c:v',
      'libwebp', // WebP codec for smaller file size than JPEG/PNG
      '-lossless',
      '0', // Use lossy compression (smaller files than lossless)
      '-q:v',
      '80', // Quality setting: 80 provides good balance of quality vs size
      '-compression_level',
      '6', // WebP compression effort (0-6, higher = better compression but slower)
      `${baseName}.webp`,
    ]);

    if (posterExitCode !== 0) {
      console.error(`Failed to extract poster from ${inputPath}`);
      return false;
    }

    console.log(`Successfully converted ${inputPath}`);
    return true;
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error.message);
    return false;
  }
}

let allSuccessful = true;

for (const inputFile of args) {
  const success = await convertVideo(inputFile);
  if (!success) {
    allSuccessful = false;
  }
}

process.exit(allSuccessful ? 0 : 1);
