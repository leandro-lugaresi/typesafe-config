import * as zod from './adapters/zod';
import { SchemaProvider } from './schema';

declare global {
  export interface TypeConfigRegistry {
    zod: zod.ZodSchemaTypeProvider;
  }
}

export const adapters: Map<keyof TypeConfigRegistry, SchemaProvider> = new Map([['zod', zod.ZodSchemaProvider]]);

export const regirsterAdapter = <T extends keyof TypeConfigRegistry>(
  name: T,
  adapter: SchemaProvider<TypeConfigRegistry[T]>,
) => {
  adapters.set(name, adapter);
};
