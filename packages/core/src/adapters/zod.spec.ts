import { describe, expect, it } from '@jest/globals';
import { expectTypeOf } from 'expect-type';
import { ZodError, z } from 'zod';
import { ZodSchemaProvider, ZodSchemaTypeProvider } from './zod';
import { InferOutput } from '../schema';

describe('ZodSchemaProvider', () => {
  const schema = z.object({
    db: z.object({ url: z.string() }),
    port: z.number(),
    nested: z.object({ foo: z.object({ bar: z.string() }) }),
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
    const validResult = ZodSchemaProvider.validate(schema, validData);
    expect(validResult).toStrictEqual({ success: true, data: validData });

    const invalidResult = ZodSchemaProvider.validate(schema, invalidData);
    expect(invalidResult).toStrictEqual({
      success: false,
      error: new ZodError([
        {
          code: 'invalid_type',
          expected: 'number',
          received: 'string',
          path: ['port'],
          message: 'Expected number, received string',
        },
      ]),
    });
  });

  it('InferSchema', () => {
    expectTypeOf<InferOutput<ZodSchemaTypeProvider, typeof schema>>().toEqualTypeOf(validData);
  });

  it('fullQualifiedKeys should return the list of FQFN based on the schema passed', async () => {
    const result = ZodSchemaProvider.fullQualifiedKeys(schema);

    expect(result).toEqual(['DB_URL', 'PORT', 'NESTED_FOO_BAR']);
  });
});
