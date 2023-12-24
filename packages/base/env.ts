import { z, ZodObject } from 'zod';
import { ConfigLoader, ConfigSchema, RawObject, Dict } from './types';

const concatKeys = (prefix: string, key: string) =>
  prefix === '' ? key : `${prefix}_${key}`;

export class EnvLoader implements ConfigLoader {
  constructor(private readonly envs: Dict<string>) { }

  /**
   * Returns the environment variable names that are used to load the given
   * schema.
   *
   * @param prefix The prefix to use for the environment variable names.
   * @param schema The schema to load.
   */
  public environmentNames(schema: ConfigSchema): string[] {
    return this.namesFromSchema('', z.object(schema));
  }

  /**
   * Returns an object with the values loaded from the environment variables.
   *
   * @param schema The schema to load.
   */
  public async load(schema: ConfigSchema) {
    return this.valuesFromSchema('', z.object(schema));
  }

  private valuesFromSchema(prefix: string, schema: ZodObject<any>) {
    const values: RawObject = {};
    for (const [key, schemaOrSpec] of Object.entries(schema.shape)) {
      if (schemaOrSpec instanceof ZodObject) {
        values[key] = this.valuesFromSchema(
          concatKeys(prefix, key.toUpperCase()),
          schemaOrSpec,
        );
      } else {
        const envKey = concatKeys(prefix, key.toUpperCase());
        if (this.envs[envKey] === undefined) {
          continue;
        }
        values[key] = this.envs[envKey];
      }
    }
    return values;
  }

  private namesFromSchema(prefix: string, schema: ZodObject<any>) {
    const names: string[] = [];
    for (const [key, schemaOrSpec] of Object.entries(schema.shape)) {
      if (schemaOrSpec instanceof ZodObject) {
        names.push(
          ...this.namesFromSchema(
            concatKeys(prefix, key.toUpperCase()),
            schemaOrSpec,
          ),
        );
      } else {
        names.push(concatKeys(prefix, key.toUpperCase()));
      }
    }
    return names;
  }
}
