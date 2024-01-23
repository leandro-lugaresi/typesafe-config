import { FQLN } from './schema';

export type Simplify<T> = {
  [P in keyof T]: T[P];
} & NonNullable<unknown>;

export interface Dict<T> {
  [key: string]: T | undefined;
}

export interface ConfigLoader {
  (fqlns: FQLN[]): Promise<unknown>;
}
