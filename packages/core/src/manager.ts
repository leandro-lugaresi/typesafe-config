import merge from 'ts-deepmerge';
import { toError } from './utils';
import { ConfigLoader, Simplify } from './types';
import { SchemaTypeProvider, InferOutput, SchemaProvider, InferInput, InferError, InferBaseSchema } from './schema';
import { adapters } from './registry';

export class ConfigManager<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
> {
  private data?: Simplify<InferOutput<TypeConfigRegistry[Adapter], TSchema>>;

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
    for (const loader of this.loaders) {
      try {
        // TODO: add the full qualified names to the loaders
        const data = await loader.load([]);
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

    const adapter = adapters.get(this.adapterKey) as SchemaProvider<TypeConfigRegistry[Adapter]>;
    if (!adapter) {
      throw new Error(`Adapter ${this.adapterKey} not registered`);
    }

    const parsedResult = adapter.validate(this.schema, data);
    if (parsedResult.success) {
      this.data = parsedResult.data;
      return;
    }

    if (this.hooks?.onValidationError) {
      this.hooks?.onValidationError(parsedResult.error, data);
      return;
    }
    throw parsedResult.error;
  }

  public values() {
    if (!this.data) {
      throw new Error('ConfigManager not initialized, did you forget to call init()?');
    }
    return this.data;
  }
}
