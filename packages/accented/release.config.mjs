export default {
  branches: ['main', { name: 'dev', prerelease: true }],
  plugins: [
    ['@semantic-release/npm', {
      prepareCmd: 'pnpm version ${nextRelease.version} --git-tag-version=false',
      publishCmd: 'pnpm publish --no-git-checks'
    }]
  ]
};
