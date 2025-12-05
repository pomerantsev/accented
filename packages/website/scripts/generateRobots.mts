#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const robotsTxtPath = join(import.meta.dirname, '../dist/robots.txt');

const isStaging = process.env.STAGE === 'true';

const content = isStaging
  ? `User-agent: *
Disallow: /`
  : '';

await writeFile(robotsTxtPath, content);
console.log(`Generated robots.txt for ${isStaging ? 'staging' : 'production'}`);
