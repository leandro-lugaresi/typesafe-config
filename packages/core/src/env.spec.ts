import { describe, expect, it } from '@jest/globals';
import { environmentVariablesLoader } from './env';

describe('environmentVariablesLoader', () => {
  const envs = {
    DB_URL: 'postgres://localhost:5432',
    PORT: '3000',
    NESTED_FOO_BAR: 'baz',
    NESTED_FOO_BAZ: 'bar', // This should be ignored
  };

  const fqlns = [
    { key: 'DB', path: ['db'], object: true },
    { key: 'DB_URL', path: ['db', 'url'], object: false },
    { key: 'PORT', path: ['port'], object: false },
    { key: 'NESTED', path: ['nested'], object: true },
    { key: 'NESTED_FOO', path: ['nested', 'foo'], object: true },
    { key: 'NESTED_FOO_BAR', path: ['nested', 'foo', 'bar'], object: false },
  ];

  it('EnvLoader must be compatible with process.env', () => {
    process.env['NODE_ENV'] = 'test';

    const loader = environmentVariablesLoader(process.env);
    const result = loader.load([{ key: 'NODE_ENV', path: ['NODE_ENV'], object: false }]);
    expect(result).toEqual({
      NODE_ENV: 'test',
    });
  });

  it('load should be able to get the values from environment variables', () => {
    const loader = environmentVariablesLoader(envs);

    const result = loader.load(fqlns);

    expect(result).toEqual({
      db: { url: 'postgres://localhost:5432' },
      // The source don't convert any value and just return the raw values
      // (string for environment variables)
      port: '3000',
      nested: { foo: { bar: 'baz' } },
    });
  });

  it('load should work if the schema have variables in "ENV_CASE"', () => {
    const loader = environmentVariablesLoader(envs);

    const result = loader.load([
      { key: 'DB_URL', path: ['DB_URL'], object: false },
      { key: 'PORT', path: ['PORT'], object: false },
      { key: 'NESTED_FOO_BAR', path: ['nested', 'foo', 'bar'], object: false },
    ]);

    expect(result).toEqual({
      DB_URL: 'postgres://localhost:5432',
      // The source don't convert any value and just return the raw values
      // (string for environment variables)
      PORT: '3000',
      nested: { foo: { bar: 'baz' } },
    });
  });

  it('should be able to get the json values from intermediary object paths', () => {
    const loader = environmentVariablesLoader({
      DB: '{ "url": "postgres://localhost:5432" }',
      PORT: '3000',
      NESTED_FOO: '{ "bar": "baz" }',
    });

    const result = loader.load(fqlns);

    expect(result).toEqual({
      db: { url: 'postgres://localhost:5432' },
      // The source don't convert any value and just return the raw values
      // (string for environment variables)
      port: '3000',
      nested: { foo: { bar: 'baz' } },
    });
  });
});
