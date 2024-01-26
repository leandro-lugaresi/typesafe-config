import { describe, expect, it } from '@jest/globals';
import { environmentVariablesLoader } from './env';

describe('environmentVariablesLoader', () => {
  const envs = {
    DB_URL: 'postgres://localhost:5432',
    PORT: '3000',
    NESTED_FOO_BAR: 'baz',
    NESTED_FOO_BAZ: 'bar', // This should be ignored
  };

  it('EnvLoader must be compatible with process.env', async () => {
    process.env['NODE_ENV'] = 'test';

    const loader = environmentVariablesLoader(process.env);
    const result = await loader.load([{ key: 'NODE_ENV', path: ['NODE_ENV'] }]);
    expect(result).toEqual({
      NODE_ENV: 'test',
    });
  });

  it('load should be able to get the values from environment variables', async () => {
    const loader = environmentVariablesLoader(envs);

    const result = await loader.load([
      { key: 'DB_URL', path: ['db', 'url'] },
      { key: 'PORT', path: ['port'] },
      { key: 'NESTED_FOO_BAR', path: ['nested', 'foo', 'bar'] },
    ]);

    expect(result).toEqual({
      db: { url: 'postgres://localhost:5432' },
      // The source don't convert any value and just return the raw values
      // (string for environment variables)
      port: '3000',
      nested: { foo: { bar: 'baz' } },
    });
  });

  it('load should work if the schema have variables in "ENV_CASE"', async () => {
    const loader = environmentVariablesLoader(envs);

    const result = await loader.load([
      { key: 'DB_URL', path: ['DB_URL'] },
      { key: 'PORT', path: ['PORT'] },
      { key: 'NESTED_FOO_BAR', path: ['nested', 'foo', 'bar'] },
    ]);

    expect(result).toEqual({
      DB_URL: 'postgres://localhost:5432',
      // The source don't convert any value and just return the raw values
      // (string for environment variables)
      PORT: '3000',
      nested: { foo: { bar: 'baz' } },
    });
  });
});
