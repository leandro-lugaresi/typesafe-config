import { SchemaProvider, SchemaTypeProvider } from '../schema';
import { AnyZodObject, z, ZodObject, ZodTypeAny } from 'zod';

const concatKeys = (prefix: string, key: string) => (prefix === '' ? key : `${prefix}_${key}`);

const namesFromSchema = <Schema extends AnyZodObject>(prefix: string, schema: Schema) => {
  const names: string[] = [];
  for (const [key, schemaOrSpec] of Object.entries(schema.shape)) {
    if (schemaOrSpec instanceof ZodObject) {
      names.push(...namesFromSchema(concatKeys(prefix, key.toUpperCase()), schemaOrSpec));
    } else {
      names.push(concatKeys(prefix, key.toUpperCase()));
    }
  }
  return names;
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
    return [];
  },
};
