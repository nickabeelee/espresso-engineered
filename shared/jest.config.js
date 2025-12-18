module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/types'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'types/**/*.ts',
    '!types/**/*.d.ts',
    '!types/**/*.test.ts',
    '!types/**/*.spec.ts'
  ]
};