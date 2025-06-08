// Jest setup file
import { Logger } from '../src/utils/logger';

// Set log level to error for tests to reduce noise
Logger.setLevel('error');

// Increase test timeout for integration tests
jest.setTimeout(30000);
