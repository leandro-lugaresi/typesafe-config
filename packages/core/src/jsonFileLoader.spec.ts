import { join, resolve } from 'path';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { jsonFileLoader } from './jsonFileLoader';

class NoErrorThrownError extends Error { }

const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call();

    throw new NoErrorThrownError();
  } catch (error: unknown) {
    return error as TError;
  }
};

describe('JsonFileLoader', () => {
  const originalEnv = process.env['NODE_ENV'];
  const originalCwd = process.cwd;

  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.cwd = () => join(originalCwd(), 'packages/core/src');
  });

  afterAll(() => {
    process.env['NODE_ENV'] = originalEnv;
    process.cwd = originalCwd;
  });

  it('default config will load the file based on process cwd and NODE_ENV', async () => {
    const loader = jsonFileLoader();
    const result = await loader([]);
    expect(result).toMatchObject({ file: 'test.json' });
  });

  it('configDir will load the file based on the given directory', async () => {
    const loader = jsonFileLoader(resolve(__dirname, './config'), 'default');
    const result = await loader([]);
    expect(result).toMatchObject({ file: 'default.json' });
  });

  it('fail if the config file does not exist', async () => {
    const loader = jsonFileLoader(resolve(__dirname, './config'), 'not-exist');
    const error = await getError<Error>(() => loader([]));
    expect(error).not.toBeInstanceOf(NoErrorThrownError);
    expect(error.message).toMatch(/config file not found/);
  });

  it('loads json5 files', async () => {
    const loader = jsonFileLoader(resolve(__dirname, './config'), 'with-comments');
    const result = await loader([]);
    expect(result).toMatchObject({ file: 'with-comments.json5' });
  });
});
