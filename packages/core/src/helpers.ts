import { AnyLoader, ConfigLoader, SyncConfigLoader, loadersAreSync } from './types';
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

export function getConfigKeysInfo<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
  Loaders extends SyncConfigLoader[],
>(adapterKey: Adapter, schema: TSchema, loaders: Loaders): ConfigKeyInfo[];
export function getConfigKeysInfo<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
  Loaders extends ConfigLoader[],
>(adapterKey: Adapter, schema: TSchema, loaders: Loaders): Promise<ConfigKeyInfo[]>;
export function getConfigKeysInfo<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
  Loaders extends AnyLoader[],
>(adapterKey: Adapter, schema: TSchema, loaders: Loaders): Promise<ConfigKeyInfo[]>;

export function getConfigKeysInfo<
  Adapter extends keyof TypeConfigRegistry,
  TSchema extends TypeConfigRegistry[Adapter]['base'],
  Loaders extends AnyLoader[],
>(adapterKey: Adapter, schema: TSchema, loaders: Loaders): Promise<ConfigKeyInfo[]> | ConfigKeyInfo[] {
  const adapter = adapters.get(adapterKey) as SchemaProvider<TypeConfigRegistry[Adapter]>;
  if (!adapter) {
    throw new Error(`Adapter ${adapterKey} not registered`);
  }

  const fqlns = adapter.fullQualifiedKeys(schema);

  const configInfo = fqlns.map((fqln: FQLN): ConfigKeyInfo => ({ ...fqln, loader: '' }));

  if (loadersAreSync(loaders)) {
    return loadSyncronously(configInfo, loaders, fqlns);
  } else {
    return loadAsyncronously(configInfo, loaders, fqlns);
  }
}

function loadSyncronously(configInfo: ConfigKeyInfo[], loaders: SyncConfigLoader[], fqlns: FQLN[]): ConfigKeyInfo[] {
  for (const loader of loaders) {
    const data = loader.load(fqlns);
    configInfo.forEach((info: ConfigKeyInfo) => {
      if (dataExists(data, info.path)) {
        info.loader = loader.identifier;
      }
    });
  }

  return configInfo.filter(info => info.object === false);
}

async function loadAsyncronously(
  configInfo: ConfigKeyInfo[],
  loaders: AnyLoader[],
  fqlns: FQLN[],
): Promise<ConfigKeyInfo[]> {
  for (const loader of loaders) {
    const data = await loader.load(fqlns);
    configInfo.forEach((info: ConfigKeyInfo) => {
      if (dataExists(data, info.path)) {
        info.loader = loader.identifier;
      }
    });
  }

  return configInfo.filter(info => info.object === false);
}
