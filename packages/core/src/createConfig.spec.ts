import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { resolve } from 'path';
import { createConfig } from './createConfig';
import { environmentVariablesLoader } from './env';
import { jsonFileLoader } from './jsonFileLoader';

describe('createConfig', () => {
  it('should be able to load the entire config from loaders', async () => {
    const config = await createConfig(
      'zod',
      z.object({
        db: z.object({ url: z.string() }),
        port: z.number(),
        nested: z.object({ foo: z.object({ bar: z.string() }) }),
      }),
      [
        jsonFileLoader(resolve(__dirname, './config'), 'default'),
        environmentVariablesLoader({
          DB_URL: 'postgres://from-env:5432',
        }),
      ],
    );

    expect(config).toEqual({
      db: { url: 'postgres://from-env:5432' },
      port: 3000,
      nested: { foo: { bar: 'baz' } },
    });
  });
});
