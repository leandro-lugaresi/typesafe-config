import { FQLN, SchemaProvider, SchemaTypeProvider } from '../schema';
import type { InferType, Schema, ValidationError, ObjectSchema } from 'yup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseSchema = ObjectSchema<any>;

const concatKeys = (prefix: string, key: string) => (prefix === '' ? key : `${prefix}_${key}`);

const isValidationError = (error: unknown): error is ValidationError => {
  return typeof error === 'object' && error !== null && 'name' in error && error['name'] === 'ValidationError';
};

const isYupObject = (schema: unknown): schema is BaseSchema => {
  return typeof schema === 'object' && schema !== null && 'type' in schema && schema['type'] === 'object';
};

const namesFromSchema = <Schema extends BaseSchema>(keyPrefix: string, paths: string[], schema: Schema): FQLN[] => {
  const fqlns: FQLN[] = [];

  for (const [key, schemaOrSpec] of Object.entries(schema.fields)) {
    const currentKey = concatKeys(keyPrefix, key.toUpperCase());
    const currentPath = paths.concat([key]);

    if (isYupObject(schemaOrSpec)) {
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

export interface YupSchemaTypeProvider extends SchemaTypeProvider {
  output: this['schema'] extends Schema ? InferType<this['schema']> : never;
  error: ValidationError;
  base: BaseSchema;
}

export const YupSchemaProvider: SchemaProvider<YupSchemaTypeProvider> = {
  validate: (schema, input) => {
    try {
      return {
        success: true,
        data: schema.validateSync(input, { strict: true, stripUnknown: true }),
      };
    } catch (error) {
      if (isValidationError(error)) {
        return { success: false, error };
      }

      throw error;
    }
  },

  fullQualifiedKeys: schema => {
    return namesFromSchema('', [], schema);
  },
};
