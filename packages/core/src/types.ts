import { ZodError, ZodType } from 'zod';

export type Simplify<T> = {
  [P in keyof T]: T[P];
} & {};

export interface Dict<T> {
  [key: string]: T | undefined;
}

export type ConfigSchema = Record<string, ZodType>;

export type RawObject = Dict<RawObject | string>;

export interface ConfigLoader {
  load(schema: ConfigSchema): Promise<unknown>;
}

export interface ConfigOptions<TSchema extends Record<string, ZodType>> {
  schema: TSchema;
  onValidationError?: (error: ZodError, dataLoaded: unknown) => never;
  onBackendError?: (error: Error) => never;
  emptyStringAsUndefined?: boolean;
  loaders: ConfigLoader[];
}
