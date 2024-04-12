import { describe, expect, it } from '@jest/globals';
import { expectTypeOf } from 'expect-type';
import { TypeboxSchemaProvider, type TypeboxSchemaTypeProvider } from './typebox';
import { InferOutput } from '../schema';
import { Kind, Type } from '@sinclair/typebox';

describe('TypeboxSchemaProvider', () => {
  const schema = Type.Object({
    db: Type.Object({ url: Type.String() }),
    port: Type.Number(),
    nested: Type.Object({ foo: Type.Object({ bar: Type.String() }) }),
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
    const validResult = TypeboxSchemaProvider.validate(schema, validData);
    expect(validResult).toStrictEqual({ success: true, data: validData });

    const invalidResult = TypeboxSchemaProvider.validate(schema, invalidData);
    expect(invalidResult).toStrictEqual({
      success: false,
      error: [
        {
          message: 'Expected number',
          path: '/port',
          schema: {
            type: 'number',
            [Kind]: 'Number',
          },
          type: 41,
          value: '3000',
        },
      ],
    });
  });

  it('InferSchema', () => {
    expectTypeOf<InferOutput<TypeboxSchemaTypeProvider, typeof schema>>().toEqualTypeOf(validData);
  });

  it('fullQualifiedKeys should return the list of FQFN based on the schema passed', async () => {
    const extendedSchema = Type.Composite([schema, Type.Object({ NODE_ENV: Type.String() })]);

    const result = TypeboxSchemaProvider.fullQualifiedKeys(extendedSchema);

    expect(result).toEqual([
      { key: 'DB', path: ['db'], object: true },
      { key: 'DB_URL', path: ['db', 'url'], object: false },
      { key: 'PORT', path: ['port'], object: false },
      { key: 'NESTED', path: ['nested'], object: true },
      { key: 'NESTED_FOO', path: ['nested', 'foo'], object: true },
      { key: 'NESTED_FOO_BAR', path: ['nested', 'foo', 'bar'], object: false },
      { key: 'NODE_ENV', path: ['NODE_ENV'], object: false },
    ]);
  });
});
