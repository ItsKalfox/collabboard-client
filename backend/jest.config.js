export default {
    testEnvironment: 'node',
    transform: {},
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/'
    ]
};
