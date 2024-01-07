import merge from 'ts-deepmerge';
import { toError } from './utils';
import { ConfigLoader, Simplify } from './types';
import { InferOutput, SchemaProvider, InferError } from './schema';
import { adapters } from './registry';

export async function createConfig<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
>(
  adapterKey: Adapter,
  schema: TSchema,
  loaders: ConfigLoader[],
  hooks?: {
    onValidationError?: (error: InferError<TypeConfigRegistry[Adapter]>, dataLoaded: unknown) => never;
    onDataLoaderError?: (error: Error) => never;
  },
): Promise<Readonly<Simplify<InferOutput<TypeConfigRegistry[Adapter], TSchema>>>> {
  const values: object[] = [];
  const adapter = adapters.get(adapterKey) as SchemaProvider<TypeConfigRegistry[Adapter]>;
  if (!adapter) {
    throw new Error(`Adapter ${adapterKey} not registered`);
  }

  const fqlns = adapter.fullQualifiedKeys(schema);
  for (const loader of loaders) {
    try {
      const data = await loader(fqlns);
      if (data) {
        values.push(data);
      }
    } catch (error) {
      if (hooks?.onDataLoaderError) {
        hooks?.onDataLoaderError(toError(error));
      } else {
        throw error;
      }
    }
  }
  const data = merge.withOptions({ mergeArrays: true, allowUndefinedOverrides: false }, ...values);

  const parsedResult = adapter.validate(schema, data);
  if (parsedResult.success) {
    return parsedResult.data;
  }

  if (hooks?.onValidationError) {
    hooks?.onValidationError(parsedResult.error, data);
  }
  throw parsedResult.error;
}
