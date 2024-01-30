import { describe, expect, it } from '@jest/globals';
import { expectTypeOf } from 'expect-type';
import { YupSchemaProvider, YupSchemaTypeProvider } from './yup';
import { InferOutput } from '../schema';
import { object, number, string, ValidationError } from 'yup';
import { createConfig } from '../createConfig';
import { environmentVariablesLoader } from '../env';

describe('YupSchemaProvider', () => {
  const schema = object({
    db: object({ url: string().required() }).required(),
    port: number().required(),
    nested: object({ foo: object({ bar: string().required() }).required() }).required(),
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
    const validResult = YupSchemaProvider.validate(schema, validData);
    expect(validResult).toStrictEqual({ success: true, data: validData });

    const invalidResult = YupSchemaProvider.validate(schema, invalidData);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error).toBeInstanceOf(ValidationError);
    }
  });

  it('InferSchema', () => {
    expectTypeOf<InferOutput<YupSchemaTypeProvider, typeof schema>>().toEqualTypeOf(validData);
  });

  it('fullQualifiedKeys should return the list of FQFN based on the schema passed', async () => {
    const extendedSchema = schema.concat(object({ NODE_ENV: string() }));

    const result = YupSchemaProvider.fullQualifiedKeys(extendedSchema);

    expect(result).toEqual([
      { key: 'NODE_ENV', path: ['NODE_ENV'] },
      { key: 'DB_URL', path: ['db', 'url'] },
      { key: 'PORT', path: ['port'] },
      { key: 'NESTED_FOO_BAR', path: ['nested', 'foo', 'bar'] },
    ]);
  });

  it('should support yup adapter', async () => {
    const config = await createConfig(
      'yup',
      object({
        db: object({ url: string() }),
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
