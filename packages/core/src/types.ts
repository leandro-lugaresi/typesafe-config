import { FQLN } from './schema';

export type Simplify<T> = {
  [P in keyof T]: T[P];
} & {};

export interface Dict<T> {
  [key: string]: T | undefined;
}

export interface ConfigLoader {
  load(fqlns: FQLN[]): Promise<unknown>;
}
