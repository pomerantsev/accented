export default {
  branches: ['main', { name: 'dev', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    ['@semantic-release/exec', {
      prepareCmd: 'pnpm version ${nextRelease.version} --git-tag-version=false',
      publishCmd: 'pnpm publish --no-git-checks'
    }],
    '@semantic-release/github',
    '@semantic-release/npm',
    '@semantic-release/release-notes-generator'
  ]
};
