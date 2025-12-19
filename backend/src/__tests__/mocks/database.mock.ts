import { jest } from '@jest/globals';
import { QueryResult } from 'pg';

export const createMockPool = () => {
  const mockQuery = jest.fn();

  return {
    query: mockQuery as any,
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
};

export const mockQueryResult = (rows: any[] = [], rowCount: number | null = null): QueryResult<any> => ({
  rows,
  rowCount: rowCount ?? rows.length,
  command: 'SELECT',
  oid: 0,
  fields: [],
});
