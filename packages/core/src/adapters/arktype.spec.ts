import { describe, expect, it } from '@jest/globals';
import { expectTypeOf } from 'expect-type';
import { type, Problems } from 'arktype';
import { ArkTypeSchemaTypeProvider, ArkTypeSchemaProvider } from './arktype';
import { InferOutput } from '../schema';
import { createConfig } from '../createConfig';
import { environmentVariablesLoader } from '../env';

describe('ArkTypeSchemaProvider', () => {
  const schema = type({
    db: { url: 'string' },
    port: 'number',
    nested: { foo: { bar: 'string' } },
  });
  const validData = {
    db: { url: 'postgres://localhost:5432' },
    port: 3000,
    nested: { foo: { bar: 'baz' } },
  };
  const invalidData = {
    db: { url: 'postgres://localhost:5432' },
    port: '3000',
    nested: { foo: { bar: 'baz' } },
  };

  it('validate', () => {
    const validResult = ArkTypeSchemaProvider.validate(schema, validData);
    expect(validResult).toStrictEqual({ success: true, data: validData });

    const invalidResult = ArkTypeSchemaProvider.validate(schema, invalidData);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error).toBeInstanceOf(Problems);
    }
  });

  it('InferSchema', () => {
    expectTypeOf<InferOutput<ArkTypeSchemaTypeProvider, typeof schema>>().toEqualTypeOf(validData);
  });

  it('fullQualifiedKeys should return the list of FQFN based on the schema passed', async () => {
    const schema = type({
      db: { url: 'string' },
      port: 'number',
      nested: { 'foo?': { bar: 'string' } },
      'NODE_ENV?': 'string',
      platform: "'linux' | 'macos' | 'windows'",
    });

    const result = ArkTypeSchemaProvider.fullQualifiedKeys(schema);

    expect(result).toEqual([
      { key: 'DB', path: ['db'], object: true },
      { key: 'DB_URL', path: ['db', 'url'], object: false },
      { key: 'PORT', path: ['port'], object: false },
      { key: 'NESTED', path: ['nested'], object: true },
      { key: 'NESTED_FOO', path: ['nested', 'foo'], object: true },
      { key: 'NESTED_FOO_BAR', path: ['nested', 'foo', 'bar'], object: false },
      { key: 'NODE_ENV', path: ['NODE_ENV'], object: false },
      { key: 'PLATFORM', path: ['platform'], object: false },
    ]);
  });

  it('should support arktype adapter', () => {
    const config = createConfig(
      'arktype',
      type({
        db: { url: 'string' },
      }),
      [
        environmentVariablesLoader({
          DB_URL: 'postgres://from-env:5432',
          NODE_ENV: 'production',
        }),
      ],
    );

    expect(config).toEqual({
      db: { url: 'postgres://from-env:5432' },
    });
  });
});
