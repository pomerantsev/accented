import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { resolve } from 'node:path';

const commonSrc = resolve('../common/src');

console.log('👀 Watching common/src for changes...');

watch(commonSrc, { recursive: true }, () => {
  spawn('pnpm', ['copyCommon'], { stdio: 'inherit' });
});
