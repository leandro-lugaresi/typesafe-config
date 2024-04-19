import { FQLN, SchemaProvider, SchemaTypeProvider } from '../schema';
import { TSchema, StaticDecode, TObject, TypeGuard } from '@sinclair/typebox';
import { Value, type ValueError } from '@sinclair/typebox/value';

const concatKeys = (prefix: string, key: string) => (prefix === '' ? key : `${prefix}_${key}`);

const namesFromSchema = <Schema extends TObject>(keyPrefix: string, paths: string[], schema: Schema): FQLN[] => {
  const fqlns: FQLN[] = [];
  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    const currentKey = concatKeys(keyPrefix, key.toUpperCase());
    const currentPath = paths.concat([key]);

    if (TypeGuard.IsObject(propertySchema)) {
      fqlns.push(
        { key: currentKey, path: currentPath, object: true },
        ...namesFromSchema(currentKey, currentPath, propertySchema),
      );
    } else {
      fqlns.push({ key: concatKeys(keyPrefix, key.toUpperCase()), path: currentPath, object: false });
    }
  }
  return fqlns;
};

export interface TypeboxSchemaTypeProvider extends SchemaTypeProvider {
  output: this['schema'] extends TSchema ? StaticDecode<this['schema']> : never;
  error: ValueError[];
  base: TObject<Record<string, TSchema>>;
}

export const TypeboxSchemaProvider: SchemaProvider<TypeboxSchemaTypeProvider> = {
  validate: (schema, input) => {
    try {
      const data = Value.Decode(schema, input);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: true, data: data as any };
    } catch {
      return { success: false, error: Array.from(Value.Errors(schema, input)) };
    }
  },

  fullQualifiedKeys: schema => {
    return namesFromSchema('', [], schema);
  },
};
