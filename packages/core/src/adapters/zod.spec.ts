import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { ZodSchemaProvider } from './zod';

describe('ZodSchemaProvider', () => {
  it('returns the correct type', () => {
    const schema = z.object({
      foo: z.string(),
    });

    const provider = ZodSchemaProvider.validate(schema, { foo: 'bar' });
    if (provider.success === true) {
      expect(provider.data.foo).toEqual('bar');
    }
    const provider2 = ZodSchemaProvider.validate(z.array(schema), { foo: 123 });
    if (provider2.success === false) {
      expect(provider2.error.errors[0].code).toEqual('invalid_type');
    }
  });
});
