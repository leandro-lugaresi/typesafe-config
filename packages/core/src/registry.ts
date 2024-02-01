import * as zod from './adapters/zod';
import * as yup from './adapters/yup';
import * as arktype from './adapters/arktype';
import { SchemaProvider } from './schema';

declare global {
  export interface TypeConfigRegistry {
    zod: zod.ZodSchemaTypeProvider;
    yup: yup.YupSchemaTypeProvider;
    arktype: arktype.ArkTypeSchemaTypeProvider;
  }
}

export const adapters = new Map<keyof TypeConfigRegistry, SchemaProvider>([
  ['zod', zod.ZodSchemaProvider],
  ['yup', yup.YupSchemaProvider],
  ['arktype', arktype.ArkTypeSchemaProvider],
]);

export const regirsterAdapter = <T extends keyof TypeConfigRegistry>(
  name: T,
  adapter: SchemaProvider<TypeConfigRegistry[T]>,
) => {
  adapters.set(name, adapter);
};
