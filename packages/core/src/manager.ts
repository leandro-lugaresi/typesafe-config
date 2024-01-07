import merge from 'ts-deepmerge';
import { toError } from './utils';
import { ConfigLoader, Simplify } from './types';
import { InferOutput, SchemaProvider, InferError } from './schema';
import { adapters } from './registry';

export class ConfigManager<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
> {
  private currentValidState?: Simplify<InferOutput<TypeConfigRegistry[Adapter], TSchema>>;

  constructor(
    private adapterKey: Adapter,
    private schema: TSchema,
    private loaders: ConfigLoader[],
    private hooks?: {
      onValidationError?: (error: InferError<TypeConfigRegistry[Adapter]>, dataLoaded: unknown) => never;
      onDataLoaderError?: (error: Error) => never;
    },
  ) { }

  public async init() {
    const values: object[] = [];
    const adapter = adapters.get(this.adapterKey) as SchemaProvider<TypeConfigRegistry[Adapter]>;
    if (!adapter) {
      throw new Error(`Adapter ${this.adapterKey} not registered`);
    }

    const fqlns = adapter.fullQualifiedKeys(this.schema);
    for (const loader of this.loaders) {
      try {
        const data = await loader(fqlns);
        if (data) {
          values.push(data);
        }
      } catch (error) {
        if (this.hooks?.onDataLoaderError) {
          this.hooks?.onDataLoaderError(toError(error));
        } else {
          throw error;
        }
      }
    }
    const data = merge.withOptions({ mergeArrays: true, allowUndefinedOverrides: false }, ...values);

    const parsedResult = adapter.validate(this.schema, data);
    if (parsedResult.success) {
      this.currentValidState = parsedResult.data;
      return;
    }

    if (this.hooks?.onValidationError) {
      this.hooks?.onValidationError(parsedResult.error, data);
      return;
    }
    throw parsedResult.error;
  }

  public values() {
    if (!this.currentValidState) {
      throw new Error('ConfigManager not initialized or without a valid config');
    }
    return this.currentValidState;
  }
}
