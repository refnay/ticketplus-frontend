import { mockDb } from './database';

export const resetMockDatabase = (): void => {
  mockDb.seedDefaults();
};
