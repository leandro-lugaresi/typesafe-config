import fs from 'fs';
import Path from 'path';
import { ConfigLoader } from './types';
import { errorHaveCode, getEnvOrDefault } from './utils';

// External dependency only used for JSON5 support.
var JSON5: JSON | null = null;

export type Config = {
  configDir?: string;
  filename?: string;
};

export class JsonFileLoader implements ConfigLoader {
  private baseNames: string[] = [];
  private readonly configDir: string = process.cwd();

  constructor(configDir?: string, baseName?: string) {
    const env = getEnvOrDefault('NODE_ENV', 'development');

    this.configDir = configDir ?? Path.join(process.cwd(), 'config');

    // if a basename is passed, we only use it.
    // This avoid mistakes like expecting to load the file provided but
    // instead load the file based on NODE_ENV.
    if (baseName !== undefined) {
      this.baseNames.push(baseName);
      return;
    }

    this.baseNames.push(env, `${env}.local`);
  }

  public async load() {
    const file = this.locateMatchingFile();
    if (file === null) {
      throw new Error(
        `config file not found. Searched for ${this.getFilesAllowed().join(
          ', ',
        )}`,
      );
    }
    const content = this.loadFile(file);
    const result = this.parseFile(content);
    if (typeof result === 'object' && result !== null) {
      return result;
    }
    throw new Error(
      `config file ${file} returned an invalid json object ${result}`,
    );
  }

  private locateMatchingFile() {
    try {
      const allowed = this.getFilesAllowed();
      const files = fs.readdirSync(this.configDir);
      const found = allowed.find((file) => files.includes(file));

      if (found === undefined) {
        return null;
      }

      return Path.join(this.configDir, found);
    } catch (error) {
      if (errorHaveCode(error) && error.code === 'ENOENT') {
        throw new Error(`config directory ${this.configDir} not found`);
      }

      if (errorHaveCode(error)) {
        throw new Error(
          `failed to load the config directory ${this.configDir}. Error: ${error.message} (${error.code})`,
        );
      }

      throw new Error(
        `failed to load the config directory ${this.configDir}. Error: ${error instanceof Error ? error.message : error
        }`,
      );
    }
  }

  private getFilesAllowed() {
    return this.baseNames
      .map((baseName) => [`${baseName}.json`, `${baseName}.json5`])
      .flat();
  }

  private loadFile(fullFileName: string) {
    try {
      return fs.readFileSync(fullFileName, 'utf-8');
    } catch (error) {
      if (errorHaveCode(error) && error.code === 'ENOENT') {
        throw new Error(`confid file ${fullFileName} not found`);
      }

      if (errorHaveCode(error)) {
        throw new Error(
          `failed to read config file ${fullFileName}. Error: ${error.message} (${error.code})`,
        );
      }

      throw new Error(
        `failed to read config file ${fullFileName}. Error: ${error instanceof Error ? error.message : error
        }`,
      );
    }
  }

  private parseFile(content: string) {
    try {
      return JSON.parse(content);
    } catch (error) {
      if (
        error instanceof SyntaxError &&
        !(
          error.message.includes("token '/'") ||
          error.message.includes('token /')
        )
      ) {
        throw error;
      }

      if (JSON5 === null) {
        JSON5 = require('json5') as JSON;
      }

      return JSON5.parse(content);
    }
  }
}
