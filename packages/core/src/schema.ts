export interface SchemaTypeProvider<Schema = unknown> {
  schema: Schema;
  input: unknown;
  output: unknown;
  base: unknown;
  error: unknown;
}

export type InferInput<SchemaType extends SchemaTypeProvider, TSchema> = (SchemaType & {
  schema: TSchema;
})['input'];

export type InferOutput<SchemaType extends SchemaTypeProvider, TSchema> = (SchemaType & {
  schema: TSchema;
})['output'];

export type InferBaseSchema<SchemaType extends SchemaTypeProvider> = SchemaType['base'];
export type InferError<SchemaType extends SchemaTypeProvider> = SchemaType['error'];

export type SchemaValidationResult<Schema, SchemaType extends SchemaTypeProvider> =
  | { success: true; data: InferOutput<SchemaType, Schema> }
  | { success: false; error: InferError<SchemaType> };

export type SchemaProvider<SchemaType extends SchemaTypeProvider = SchemaTypeProvider> = {
  validate: <TSchema extends InferBaseSchema<SchemaType>>(
    schema: TSchema,
    input: unknown,
  ) => SchemaValidationResult<TSchema, SchemaType>;
  fullQualifiedKeys: <TSchema extends InferBaseSchema<SchemaType>>(schema: TSchema) => string[];
};
