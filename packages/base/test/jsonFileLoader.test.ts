import Path from 'path';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { JsonFileLoader } from '../jsonFileLoader';

describe('JsonFileLoader', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalCwd = process.cwd;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.cwd = () => Path.join(originalCwd(), 'packages/base/test');
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    process.cwd = originalCwd;
  });

  test('default config will load the file based on process cwd and NODE_ENV', async () => {
    const loader = new JsonFileLoader();
    const result = await loader.load();
    expect(result).toMatchObject({ file: 'test.json' });
  });

  test('configDir will load the file based on the given directory', async () => {
    const loader = new JsonFileLoader(
      Path.resolve(__dirname, './config'),
      'default',
    );
    const result = await loader.load();
    expect(result).toMatchObject({ file: 'default.json' });
  });

  test.skip('fail if the config file does not exist', async () => {
    const loader = new JsonFileLoader(
      Path.resolve(__dirname, './config'),
      'not-exist',
    );
    expect(() => loader.load()).toThrow(/config file not found/);
  });

  test('loads json5 files', async () => {
    const loader = new JsonFileLoader(
      Path.resolve(__dirname, './config'),
      'with-comments',
    );
    const result = await loader.load();
    expect(result).toMatchObject({ file: 'with-comments.json5' });
  });
});
