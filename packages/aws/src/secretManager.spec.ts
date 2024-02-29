import { beforeEach, describe, expect, it } from '@jest/globals';
import { secretManagerLoader } from './secretManager';
import { mockClient } from 'aws-sdk-client-mock';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const fqlns = [
  { key: 'DB', path: ['db'], object: true },
  { key: 'DB_URL', path: ['db', 'url'], object: false },
  { key: 'DB_USERNAME', path: ['db', 'username'], object: false },
  { key: 'DB_PASSWORD', path: ['db', 'password'], object: false },
  { key: 'DB_ENGINE', path: ['db', 'engine'], object: false },
  { key: 'DB_HOST', path: ['db', 'host'], object: false },
  { key: 'DB_PORT', path: ['db', 'port'], object: false },
  { key: 'DB_DBNAME', path: ['db', 'dbname'], object: false },
  { key: 'PORT', path: ['port'], object: false },
  { key: 'NESTED', path: ['nested'], object: true },
  { key: 'NESTED_FOO', path: ['nested', 'foo'], object: true },
  { key: 'NESTED_FOO_BAR', path: ['nested', 'foo', 'bar'], object: false },
];
const envs = {
  DB_URL: 'postgres://localhost:5432',
  PORT: '3000',
  NESTED_FOO_BAR: 'baz',
  NESTED_FOO_BAZ: 'bar', // This should be ignored
};
const clientMock = mockClient(SecretsManagerClient);

beforeEach(() => {
  clientMock.reset();
});

describe('secretManagerLoader', () => {
  describe('env mode', () => {
    it('should decode the json config and rebuild the object based on the FQLNs provided', async () => {
      clientMock.on(GetSecretValueCommand).resolvesOnce({ SecretString: JSON.stringify(envs) });
      const loader = secretManagerLoader(new SecretsManagerClient(), { mode: 'env', secretId: 'your-arn-id' });
      const result = await loader.load(fqlns);
      expect(result).toMatchObject({
        db: { url: 'postgres://localhost:5432' },
        port: '3000',
        nested: { foo: { bar: 'baz' } },
      });
    });
  });
  describe('config mode', () => {
    it('should decode the config and recreate the object based on the path passed', async () => {
      clientMock.on(GetSecretValueCommand).resolvesOnce({
        SecretString: JSON.stringify({
          username: 'test',
          password: 'testpassword',
          engine: 'postgres',
          host: '127.0.0.1',
          port: '4321',
          dbname: 'test',
        }),
      });
      const loader = secretManagerLoader(new SecretsManagerClient(), {
        mode: 'config',
        secretId: 'your-arn-id',
        configPath: ['db'],
      });
      const result = await loader.load(fqlns);
      expect(result).toMatchObject({
        db: {
          username: 'test',
          password: 'testpassword',
          engine: 'postgres',
          host: '127.0.0.1',
          port: '4321',
          dbname: 'test',
        },
      });
    });
  });
});
