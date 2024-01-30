import * as zod from './adapters/zod';
import * as yup from './adapters/yup';
import { SchemaProvider } from './schema';

declare global {
  export interface TypeConfigRegistry {
    zod: zod.ZodSchemaTypeProvider;
    yup: yup.YupSchemaTypeProvider;
  }
}

export const adapters = new Map<keyof TypeConfigRegistry, SchemaProvider>([
  ['zod', zod.ZodSchemaProvider],
  ['yup', yup.YupSchemaProvider],
]);

export const regirsterAdapter = <T extends keyof TypeConfigRegistry>(
  name: T,
  adapter: SchemaProvider<TypeConfigRegistry[T]>,
) => {
  adapters.set(name, adapter);
};
