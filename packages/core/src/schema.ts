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

export type FQLN = { key: string; path: string[] };

export type SchemaProvider<SchemaType extends SchemaTypeProvider = SchemaTypeProvider> = {
  validate: <TSchema extends InferBaseSchema<SchemaType>>(
    schema: TSchema,
    input: unknown,
  ) => SchemaValidationResult<TSchema, SchemaType>;

  /**
   * Returns an array with the FQLN key and the object path.
   * We use this key to load from environment variables or
   * any other Key/value configuration source.
   *
   * The path is the object path to the value in the schema.
   * For example, if we have the following schema:
   *
   * ```ts
   * const schema = z.object({
   *  db: z.object({ url: z.string() }),
   *  port: z.number(),
   *  NODE_ENV: z.string(),
   *  });
   *  ```
   *
   *  The result will be:
   *  ```ts
   *  [
   *    {key: 'DB_URL', path: ['db', 'url']},
   *    {key: 'PORT', path: ['port']},
   *    {key: 'NODE_ENV', path: ['NODE_ENV']}
   *  ]
   *  ```
   *
   * @param schema The schema to load.
   */
  fullQualifiedKeys: <TSchema extends InferBaseSchema<SchemaType>>(schema: TSchema) => FQLN[];
};
