import merge from 'ts-deepmerge';
import { z, ZodObject } from 'zod';
import { toError } from './utils';
import { ConfigOptions, ConfigSchema, Simplify } from './types';

export class ConfigManager<TSchema extends ConfigSchema> {
  private data?: Simplify<z.infer<ZodObject<TSchema>>>;
  private schema: ZodObject<TSchema>;

  constructor(private readonly options: ConfigOptions<TSchema>) {
    this.schema = z.object(options.schema);
  }

  public init() {
    return this.sync();
  }

  public async sync() {
    const values: object[] = [];
    for (const loader of this.options.loaders) {
      try {
        const data = await loader.load(this.options.schema);
        if (data) {
          values.push(data);
        }
      } catch (error) {
        if (this.options.onBackendError) {
          this.options.onBackendError(toError(error));
        } else {
          throw error;
        }
      }
    }
    const data = merge.withOptions(
      { mergeArrays: true, allowUndefinedOverrides: false },
      ...values,
    );

    const parsedResult = this.schema.safeParse(data);
    if (!parsedResult.success) {
      if (this.options.onValidationError) {
        this.options.onValidationError(parsedResult.error);
      } else {
        throw parsedResult.error;
      }
    }
    if (parsedResult.success) {
      this.data = parsedResult.data;
    }
  }

  public values() {
    if (this.data === undefined) {
      throw new Error('No config available, did you forget to call init()?');
    }
    return this.data;
  }
}
