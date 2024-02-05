import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { resolve } from 'path';
import { getConfigKeysInfo } from './helpers';
import { environmentVariablesLoader } from './env';
import { jsonFileLoader } from './jsonFileLoader';

describe('getConfigKeysInfo', () => {
  it('returns the keys info based on the schema', async () => {
    const dir = resolve(__dirname, './config');
    const info = await getConfigKeysInfo(
      'zod',
      z.object({
        db: z.object({ url: z.string() }),
        port: z.number(),
        nested: z.object({ foo: z.object({ bar: z.string() }) }),
      }),
      [
        jsonFileLoader(dir, 'default'),
        environmentVariablesLoader({
          DB: '{ "url": "postgres://from-env:5432"}',
        }),
      ],
    );

    expect(info).toEqual([
      { key: 'DB_URL', loader: 'environmentVariablesLoader', path: ['db', 'url'], object: false },
      {
        key: 'PORT',
        loader: `jsonFileLoader(${dir}, [default])`,
        path: ['port'],
        object: false,
      },
      {
        key: 'NESTED_FOO_BAR',
        loader: `jsonFileLoader(${dir}, [default])`,
        path: ['nested', 'foo', 'bar'],
        object: false,
      },
    ]);
  });
});
