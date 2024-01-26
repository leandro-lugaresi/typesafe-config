import { FQLN } from './schema';
import { ConfigLoader, Dict } from './types';

export function environmentVariablesLoader(envs: Dict<string>): ConfigLoader {
  return {
    load: (fqlns: FQLN[]) => {
      const result: Record<string, unknown> = {};

      for (const fqln of fqlns) {
        const value = envs[fqln.key];
        if (value === undefined) {
          continue;
        }

        let current = result;
        for (let i = 0; i < fqln.path.length; i++) {
          const k = fqln.path[i];
          if (i === fqln.path.length - 1) {
            current[k] = value;
          } else {
            current[k] = current[k] || {};
            current = current[k] as Record<string, unknown>;
          }
        }
      }

      return Promise.resolve(result);
    },
    identifier: 'environmentVariablesLoader',
  };
}
