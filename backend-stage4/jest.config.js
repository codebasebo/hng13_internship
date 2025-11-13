module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services', '<rootDir>/shared'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'services/**/*.ts',
    'shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@gateway/(.*)$': '<rootDir>/services/api-gateway/src/$1',
    '^@user/(.*)$': '<rootDir>/services/user-service/src/$1',
    '^@email/(.*)$': '<rootDir>/services/email-service/src/$1',
    '^@push/(.*)$': '<rootDir>/services/push-service/src/$1',
    '^@template/(.*)$': '<rootDir>/services/template-service/src/$1'
  }
};
