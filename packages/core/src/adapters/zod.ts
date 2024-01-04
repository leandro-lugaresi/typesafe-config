import { FQLN, SchemaProvider, SchemaTypeProvider } from '../schema';
import { AnyZodObject, z, ZodObject, ZodTypeAny } from 'zod';

const concatKeys = (prefix: string, key: string) => (prefix === '' ? key : `${prefix}_${key}`);

const namesFromSchema = <Schema extends AnyZodObject>(keyPrefix: string, paths: string[], schema: Schema): FQLN[] => {
  const fqlns: FQLN[] = [];
  for (const [key, schemaOrSpec] of Object.entries(schema.shape)) {
    const currentKey = concatKeys(keyPrefix, key.toUpperCase());
    const currentPath = paths.concat([key]);
    if (schemaOrSpec instanceof ZodObject) {
      fqlns.push(...namesFromSchema(currentKey, currentPath, schemaOrSpec));
    } else {
      fqlns.push({ key: concatKeys(keyPrefix, key.toUpperCase()), path: currentPath });
    }
  }
  return fqlns;
};

export interface ZodSchemaTypeProvider extends SchemaTypeProvider {
  input: this['schema'] extends ZodTypeAny ? z.input<this['schema']> : never;
  output: this['schema'] extends ZodTypeAny ? z.output<this['schema']> : never;
  error: z.ZodError;
  base: ZodObject<Record<string, ZodTypeAny>>;
}

export const ZodSchemaProvider: SchemaProvider<ZodSchemaTypeProvider> = {
  validate: (schema, input) => {
    const result = schema.safeParse(input);
    if (result.success) {
      // TODO: This is a hack, we should not need to cast here
      return { success: true, data: result.data as ZodSchemaTypeProvider['output'] };
    } else {
      return { success: false, error: result.error };
    }
  },

  fullQualifiedKeys: schema => {
    return namesFromSchema('', [], schema);
  },
};
