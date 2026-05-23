// Jest configuration — atlas-ally test scaffold
// See HANDOFF_v6_37 "Next 3 projects" #1 for context.

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  setupFiles: ['./jest.setup.js'],
  testTimeout: 10000,
  // Don't watch node_modules or production data when running --watch
  watchPathIgnorePatterns: ['/node_modules/', '/data/'],
  // Clear mocks between tests so state doesn't leak
  clearMocks: true,
};
