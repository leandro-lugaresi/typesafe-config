import { FQLN, SchemaProvider, SchemaTypeProvider } from '../schema';
import type { AnyZodObject, z, ZodObject, ZodTypeAny } from 'zod';

const concatKeys = (prefix: string, key: string) => (prefix === '' ? key : `${prefix}_${key}`);

const isZodObject = (schema: unknown): schema is AnyZodObject => {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    '_def' in schema &&
    typeof schema['_def'] === 'object' &&
    schema['_def'] !== null &&
    'typeName' in schema['_def'] &&
    schema['_def']['typeName'] === 'ZodObject'
  );
};

const namesFromSchema = <Schema extends AnyZodObject>(keyPrefix: string, paths: string[], schema: Schema): FQLN[] => {
  const fqlns: FQLN[] = [];
  for (const [key, schemaOrSpec] of Object.entries(schema.shape)) {
    const currentKey = concatKeys(keyPrefix, key.toUpperCase());
    const currentPath = paths.concat([key]);

    if (isZodObject(schemaOrSpec)) {
      fqlns.push(
        { key: currentKey, path: currentPath, object: true },
        ...namesFromSchema(currentKey, currentPath, schemaOrSpec),
      );
    } else {
      fqlns.push({ key: concatKeys(keyPrefix, key.toUpperCase()), path: currentPath, object: false });
    }
  }
  return fqlns;
};

export interface ZodSchemaTypeProvider extends SchemaTypeProvider {
  output: this['schema'] extends ZodTypeAny ? z.output<this['schema']> : never;
  error: z.ZodError;
  base: ZodObject<Record<string, ZodTypeAny>>;
}

export const ZodSchemaProvider: SchemaProvider<ZodSchemaTypeProvider> = {
  validate: (schema, input) => {
    const result = schema.safeParse(input);
    if (result.success) {
      // TODO: is possible to remove the cast?
      return { success: true, data: result.data as ZodSchemaTypeProvider['output'] };
    } else {
      return { success: false, error: result.error };
    }
  },

  fullQualifiedKeys: schema => {
    return namesFromSchema('', [], schema);
  },
};
