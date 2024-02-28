import type { ConfigLoader, FQLN } from '@typesafe-config/core';
import { SecretsManagerClient, GetSecretValueCommand, SecretValueEntry } from '@aws-sdk/client-secrets-manager';

type EnvModeOption = { mode: 'env'; secretId: string };
type configModeOption = { mode: 'config'; secretId: string; configPath: string[] };
type Options = EnvModeOption | configModeOption;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getSecretValue(value: SecretValueEntry): string {
  if (value.SecretString) {
    return value.SecretString;
  }

  if (value.SecretBinary) {
    const buff = Buffer.from(value.SecretBinary?.toString(), 'base64');
    return buff.toString('ascii');
  }

  return '';
}

function mapSecretsToConfigObject(fqlns: FQLN[], secret: SecretValueEntry, options: Options): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const value = getSecretValue(secret);
  const parsedValue = parseValue(value);

  if (options.mode === 'config') {
    const configPath = options.configPath;
    let current = result;
    for (let i = 0; i < configPath.length; i++) {
      const key = configPath[i];
      if (i === configPath.length - 1) {
        current[key] = parsedValue;
      } else {
        current[key] = current[key] || {};
        current = current[key] as Record<string, unknown>;
      }
    }
    return result;
  }

  if (options.mode === 'env' && isRecord(parsedValue)) {
    for (const fqln of fqlns) {
      const value = parsedValue[fqln.key];
      if (value === undefined) {
        continue;
      }

      let current = result;
      for (let i = 0; i < fqln.path.length; i++) {
        const key = fqln.path[i];
        if (i === fqln.path.length - 1) {
          current[key] = value;
        } else {
          current[key] = current[key] || {};
          current = current[key] as Record<string, unknown>;
        }
      }
    }
    return result;
  }

  return result;
}

export function secretManagerLoader(client: SecretsManagerClient, options: Options): ConfigLoader {
  return {
    load: async fqlns => {
      const response = await client.send(new GetSecretValueCommand({ SecretId: options.secretId }));

      return mapSecretsToConfigObject(fqlns, response, options);
    },
    identifier: 'aws-secrets-manager',
  };
}
