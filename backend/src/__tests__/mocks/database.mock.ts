import { jest } from '@jest/globals';

export const createMockPool = () => {
  const mockQuery = jest.fn();

  return {
    query: mockQuery,
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
};

export const mockQueryResult = (rows: any[] = [], rowCount: number | null = null) => ({
  rows,
  rowCount: rowCount ?? rows.length,
  command: 'SELECT',
  oid: 0,
  fields: [],
});
