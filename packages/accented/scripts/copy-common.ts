/**
 * Copies the contents of the `common` package.
 * We cannot list `common` as a dependency since `accented` is published separately,
 * and doesn't have access to the workspace when published.
 */

import { cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const commonSrc = resolve('../common/src');
const targetDir = resolve('./src/common');

try {
  // Remove existing directory if it exists
  await rm(targetDir, { recursive: true, force: true });

  // Copy common source files
  await cp(commonSrc, targetDir, { recursive: true });
} catch (error) {
  console.error('❌ Failed to copy common package:', error);
  process.exit(1);
}
