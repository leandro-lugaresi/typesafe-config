import { FQLN } from './schema';

export type Simplify<T> = {
  [P in keyof T]: T[P];
} & NonNullable<unknown>;

export interface Dict<T> {
  [key: string]: T | undefined;
}

export type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[] ? ElementType : never;
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyObject = Record<string, any>;
export type AnyLoader = ConfigLoader | SyncConfigLoader;

export type ConfigLoader = {
  type: 'ConfigLoader';
  load: (fqlns: FQLN[]) => Promise<AnyObject>;
  identifier: string;
};

export type SyncConfigLoader = {
  type: 'SyncConfigLoader';
  load: (fqlns: FQLN[]) => AnyObject;
  identifier: string;
};
