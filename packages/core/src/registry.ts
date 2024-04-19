import * as zod from './adapters/zod';
import * as yup from './adapters/yup';
import * as arktype from './adapters/arktype';
import * as typebox from './adapters/typebox';
import { SchemaProvider } from './schema';

declare global {
  export interface TypeConfigRegistry {
    zod: zod.ZodSchemaTypeProvider;
    yup: yup.YupSchemaTypeProvider;
    arktype: arktype.ArkTypeSchemaTypeProvider;
    typebox: typebox.TypeboxSchemaTypeProvider;
  }
}

export const adapters = new Map<keyof TypeConfigRegistry, SchemaProvider>([
  ['zod', zod.ZodSchemaProvider],
  ['yup', yup.YupSchemaProvider],
  ['arktype', arktype.ArkTypeSchemaProvider],
  ['typebox', typebox.TypeboxSchemaProvider],
]);

export const regirsterAdapter = <T extends keyof TypeConfigRegistry>(
  name: T,
  adapter: SchemaProvider<TypeConfigRegistry[T]>,
) => {
  adapters.set(name, adapter);
};
