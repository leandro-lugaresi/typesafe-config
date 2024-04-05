import { FQLN } from './schema';
import { Dict, SyncConfigLoader } from './types';

function parseValue(value: string): unknown {
  try {
    if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
      return JSON.parse(value);
    }
    return value;
  } catch {
    return value;
  }
}

export function environmentVariablesLoader(envs: Dict<string>): SyncConfigLoader {
  return {
    load: (fqlns: FQLN[]) => {
      const result: Record<string, unknown> = {};

      for (const fqln of fqlns) {
        const value = envs[fqln.key];
        if (value === undefined) {
          continue;
        }

        const parsedValue = parseValue(value);

        let current = result;
        for (let i = 0; i < fqln.path.length; i++) {
          const k = fqln.path[i];
          if (i === fqln.path.length - 1) {
            current[k] = parsedValue;
          } else {
            current[k] = current[k] || {};
            current = current[k] as Record<string, unknown>;
          }
        }
      }

      return result;
    },
    type: 'SyncConfigLoader',
    identifier: 'environmentVariablesLoader',
  };
}
