import merge from 'ts-deepmerge';
import { toError } from './utils';
import { AnyLoader, AnyObject, ConfigLoader, Simplify, SyncConfigLoader } from './types';
import { InferOutput, SchemaProvider, InferError, FQLN } from './schema';
import { adapters } from './registry';

type BaseReturnType<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
> = Readonly<Simplify<InferOutput<TypeConfigRegistry[Adapter], TSchema>>>;

type MultiLoaderResults = {
  values: AnyObject[];
  errors: Error[];
};

type Hooks<Adapter extends keyof TypeConfigRegistry> = {
  onValidationError?: (error: InferError<TypeConfigRegistry[Adapter]>, dataLoaded: unknown) => never;
  onDataLoaderError?: (error: Error) => never;
};

export function createConfig<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
  L extends SyncConfigLoader[],
>(adapterKey: Adapter, schema: TSchema, loaders: L, hooks?: Hooks<Adapter>): BaseReturnType<Adapter, TSchema>;
export function createConfig<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
  L extends ConfigLoader[],
>(adapterKey: Adapter, schema: TSchema, loaders: L, hooks?: Hooks<Adapter>): Promise<BaseReturnType<Adapter, TSchema>>;
export function createConfig<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
  L extends AnyLoader[],
>(adapterKey: Adapter, schema: TSchema, loaders: L, hooks?: Hooks<Adapter>): Promise<BaseReturnType<Adapter, TSchema>>;

export function createConfig<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
  L extends AnyLoader[],
>(
  adapterKey: Adapter,
  schema: TSchema,
  loaders: L,
  hooks?: Hooks<Adapter>,
): Promise<BaseReturnType<Adapter, TSchema>> | BaseReturnType<Adapter, TSchema> {
  const adapter = adapters.get(adapterKey) as SchemaProvider<TypeConfigRegistry[Adapter]>;
  if (!adapter) {
    throw new Error(`Adapter ${adapterKey} not registered`);
  }
  const fqlns = adapter.fullQualifiedKeys(schema);

  if (loadersAreSync(loaders)) {
    const values = loadSyncronously(loaders, fqlns);
    return processResults(adapter, schema, values, hooks);
  } else {
    return loadAsyncronously(loaders, fqlns).then(results => processResults(adapter, schema, results, hooks));
  }
}

function loadersAreSync(loaders: AnyLoader[]): loaders is SyncConfigLoader[] {
  return loaders.every(loader => loader.type === 'SyncConfigLoader');
}

function isRejected(input: PromiseSettledResult<unknown>): input is PromiseRejectedResult {
  return input.status === 'rejected';
}

function isFulfilled<T>(input: PromiseSettledResult<T>): input is PromiseFulfilledResult<T> {
  return input.status === 'fulfilled';
}

async function loadAsyncronously(loaders: AnyLoader[], fqlns: FQLN[]): Promise<MultiLoaderResults> {
  const result = await Promise.allSettled(loaders.map(loader => loader.load(fqlns)));
  const errors = result
    .filter(isRejected)
    .map(data => data.reason)
    .map(toError);
  const values = result.filter(isFulfilled).map(data => data.value);
  return { errors, values };
}

function loadSyncronously(loaders: AnyLoader[], fqlns: FQLN[]): MultiLoaderResults {
  const values: AnyObject[] = [];
  const errors: Error[] = [];
  for (const loader of loaders) {
    try {
      const data = loader.load(fqlns);
      if (typeof data === 'object' && data !== null) {
        values.push(data);
      }
    } catch (error) {
      errors.push(toError(error));
    }
  }
  return { errors, values };
}

function processResults<Adapter extends keyof TypeConfigRegistry, TSchema extends TypeConfigRegistry[Adapter]['base']>(
  adapter: SchemaProvider<TypeConfigRegistry[Adapter]>,
  schema: TSchema,
  results: MultiLoaderResults,
  hooks?: Hooks<Adapter>,
) {
  if (results.errors.length > 0) {
    if (hooks?.onDataLoaderError) {
      results.errors.forEach(hooks.onDataLoaderError);
    }
    throw results.errors[0];
  }
  const data = merge.withOptions({ mergeArrays: true, allowUndefinedOverrides: false }, ...results.values);

  const parsedResult = adapter.validate(schema, data);
  if (parsedResult.success) {
    return parsedResult.data;
  }

  if (hooks?.onValidationError) {
    hooks?.onValidationError(parsedResult.error, data);
  }
  throw parsedResult.error;
}
