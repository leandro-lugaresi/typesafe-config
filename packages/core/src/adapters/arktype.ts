import { FQLN, SchemaProvider, SchemaTypeProvider } from '../schema';
import type { Type, Problems } from 'arktype';

const concatKeys = (prefix: string, key: string) => (prefix === '' ? key : `${prefix}_${key}`);

const isObjectDefinition = (definition: unknown): definition is Record<string, unknown> => {
  return typeof definition === 'object' && definition !== null;
};

const namesFromSchema = (keyPrefix: string, paths: string[], definition: unknown): FQLN[] => {
  const fqlns: FQLN[] = [];

  if (!isObjectDefinition(definition)) {
    return fqlns;
  }

  for (const [key, definitionOrSyntax] of Object.entries(definition)) {
    const processedKey = key.replace('?', '');
    const currentKey = concatKeys(keyPrefix, processedKey.toUpperCase());
    const currentPath = paths.concat([processedKey]);

    if (isObjectDefinition(definitionOrSyntax)) {
      fqlns.push(
        { key: currentKey, path: currentPath, object: true },
        ...namesFromSchema(currentKey, currentPath, definitionOrSyntax),
      );
    } else {
      fqlns.push({ key: currentKey, path: currentPath, object: false });
    }
  }
  return fqlns;
};

export interface ArkTypeSchemaTypeProvider extends SchemaTypeProvider {
  output: this['schema'] extends Type ? this['schema']['infer'] : never;
  error: Problems;
  base: Type;
}

export const ArkTypeSchemaProvider: SchemaProvider<ArkTypeSchemaTypeProvider> = {
  validate: (schema, input) => {
    const result = schema(input);
    if (result.problems == null) {
      return { success: true, data: result.data as ArkTypeSchemaTypeProvider['output'] };
    }
    return { success: false, error: result.problems };
  },

  fullQualifiedKeys: schema => {
    return namesFromSchema('', [], schema.definition);
  },
};
