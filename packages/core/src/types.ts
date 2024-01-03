import * as zodProvider from './adapters/zod';
import { InferError, SchemaTypeProvider } from './schema';

export type Simplify<T> = {
  [P in keyof T]: T[P];
} & {};

export interface Dict<T> {
  [key: string]: T | undefined;
}

export type RawObject = Dict<RawObject | string>;

export interface ConfigLoader {
  load(fullQualifiedNames: string[]): Promise<unknown>;
}

type DefaultSchemaTypeProvider = zodProvider.ZodSchemaTypeProvider;

export interface ConfigOptions<TypeProvider extends SchemaTypeProvider = DefaultSchemaTypeProvider> {
  schema: TypeProvider['schema'];
  onValidationError?: (error: InferError<TypeProvider>, dataLoaded: unknown) => never;
  onDataLoaderError?: (error: Error) => never;
  loaders: ConfigLoader[];
}
