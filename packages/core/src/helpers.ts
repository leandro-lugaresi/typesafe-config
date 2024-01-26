import { ConfigLoader } from './types';
import { FQLN, SchemaProvider } from './schema';
import { adapters } from './registry';

type ConfigKeyInfo = FQLN & { loader?: string };

const dataExists = (data: unknown, path: string[]): boolean => {
  if (!data) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = data;
  for (const k of path) {
    if (typeof current !== 'object' || !(k in current)) {
      return false;
    }
    current = current[k];
  }
  return true;
};

export async function getConfigKeysInfo<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
>(adapterKey: Adapter, schema: TSchema, loaders: ConfigLoader[]): Promise<ConfigKeyInfo[]> {
  const adapter = adapters.get(adapterKey) as SchemaProvider<TypeConfigRegistry[Adapter]>;
  if (!adapter) {
    throw new Error(`Adapter ${adapterKey} not registered`);
  }

  const fqlns = adapter.fullQualifiedKeys(schema);

  const configInfo = fqlns.map((fqln: FQLN): ConfigKeyInfo => ({ ...fqln, loader: '' }));

  for (const loader of loaders) {
    const data = await loader.load(fqlns);
    configInfo.forEach((info: ConfigKeyInfo) => {
      if (dataExists(data, info.path)) {
        info.loader = loader.identifier;
      }
    });
  }
  return configInfo;
}
