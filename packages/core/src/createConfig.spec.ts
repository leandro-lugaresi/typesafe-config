import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { resolve } from 'path';
import { createConfig } from './createConfig';
import { environmentVariablesLoader } from './env';
import { jsonFileLoader } from './jsonFileLoader';

describe('createConfig', () => {
  const schema = z.object({
    db: z.object({ url: z.string() }),
    port: z.coerce.number(),
    nested: z.object({ foo: z.object({ bar: z.string() }) }),
  });

  it('works with mixed (async and sync) loaders', async () => {
    const config = await createConfig('zod', schema, [
      jsonFileLoader(resolve(__dirname, './config'), 'default'),
      environmentVariablesLoader({
        DB_URL: 'postgres://from-env:5432',
      }),
    ]);

    expect(config).toEqual({
      db: { url: 'postgres://from-env:5432' },
      port: 3000,
      nested: { foo: { bar: 'baz' } },
    });
  });

  it('works with just sync loaders', () => {
    const config = createConfig('zod', schema, [
      environmentVariablesLoader({
        DB_URL: 'postgres://from-env:5432',
        PORT: '3000',
        NESTED_FOO_BAR: 'baz',
      }),
    ]);

    expect(config).toEqual({
      db: { url: 'postgres://from-env:5432' },
      port: 3000,
      nested: { foo: { bar: 'baz' } },
    });
  });
});
