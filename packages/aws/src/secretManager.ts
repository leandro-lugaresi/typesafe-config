import type { ConfigLoader, FQLN } from '@typesafe-config/core';
import {
  SecretsManagerClient,
  BatchGetSecretValueCommand,
  SecretValueEntry,
  APIErrorType,
} from '@aws-sdk/client-secrets-manager';

type Secrets = Map<string, SecretValueEntry>;
type Options = { onErrors?: (errors: APIErrorType[]) => void };

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

async function getSercretsInBatch(client: SecretsManagerClient, fqlns: FQLN[]) {
  let isDone = false;
  let nextToken: string | undefined;
  const secrets: Secrets = new Map();
  const errors: APIErrorType[] = [];

  while (!isDone) {
    isDone = true;
    const result = await client.send(
      new BatchGetSecretValueCommand({
        Filters: [{ Key: 'name', Values: fqlns.map(fqln => fqln.key) }],
        NextToken: nextToken,
      }),
    );
    if (result.Errors) {
      errors.push(...result.Errors);
    }

    if (result.SecretValues) {
      for (const secret of result.SecretValues) {
        secrets.set(secret.Name ?? '', secret);
      }
    }
    if (result.NextToken) {
      nextToken = result.NextToken;
      isDone = false;
    }
  }
  return { secrets, errors };
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

function mapSecretsToConfigObject(fqlns: FQLN[], secrets: Secrets): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const fqln of fqlns) {
    const value = secrets.get(fqln.key);
    if (value === undefined) {
      continue;
    }

    const data = getSecretValue(value);
    const parsedValue = parseValue(data);

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
}

export function secretManagerLoader(client: SecretsManagerClient, options: Options): ConfigLoader {
  return {
    load: async fqlns => {
      const result = await getSercretsInBatch(client, fqlns);

      if (options.onErrors && result.errors.length > 0) {
        options.onErrors(result.errors);
      }

      return mapSecretsToConfigObject(fqlns, result.secrets);
    },
    identifier: 'aws-secrets-manager',
  };
}
