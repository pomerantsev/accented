import fs from 'node:fs/promises';
import path from 'node:path';

const srcDir = path.resolve('./src');
const distDir = path.resolve('./dist');

let filesMissing = false;

async function checkGeneratedFiles(sourceFilePath: string) {
  const relativePath = path.relative(srcDir, sourceFilePath);
  for (const extension of ['.js', '.js.map', '.d.ts', '.d.ts.map']) {
    const generatedFile = path.join(distDir, relativePath.replace(/\.ts$/, extension));
    try {
      await fs.access(generatedFile, fs.constants.R_OK);
    } catch {
      console.error(`${generatedFile} is missing.`);
      filesMissing = true;
    }
  }
}

async function analyzeDir(dirPath: string) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await analyzeDir(fullPath);
    } else if (fullPath.match(/\.ts$/) && !fullPath.match(/\.test\.ts$/)) {
      await checkGeneratedFiles(fullPath);
    }
  }
}

await analyzeDir(srcDir);

if (filesMissing) {
  process.exit(1);
} else {
  console.log('All output files generated correctly.');
}
