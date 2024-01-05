import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { resolve } from 'path';
import { ConfigManager } from './manager';
import { EnvLoader } from './env';
import { JsonFileLoader } from './jsonFileLoader';

describe(ConfigManager, () => {
  it('should be able to load the entire config from loaders', async () => {
    const manager = new ConfigManager(
      'zod',
      z.object({
        db: z.object({ url: z.string() }),
        port: z.number(),
        nested: z.object({ foo: z.object({ bar: z.string() }) }),
      }),
      [
        new JsonFileLoader(resolve(__dirname, './config'), 'default'),
        new EnvLoader({
          DB_URL: 'postgres://from-env:5432',
        }),
      ],
    );

    await manager.init();

    expect(manager.values()).toEqual({
      db: { url: 'postgres://from-env:5432' },
      port: 3000,
      nested: { foo: { bar: 'baz' } },
    });
  });
});
