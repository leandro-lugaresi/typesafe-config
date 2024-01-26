import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ConfigLoader } from './types';
import { errorHaveCode, getEnvOrDefault } from './utils';

// External dependency only used for JSON5 support.
let JSON5: JSON | null = null;

function getFilesAllowed(baseNames: string[]) {
  return baseNames.map(baseName => [`${baseName}.json`, `${baseName}.json5`]).flat();
}

function locateMatchingFile(configDir: string, baseNames: string[]) {
  try {
    const allowed = getFilesAllowed(baseNames);
    const files = readdirSync(configDir);
    const found = allowed.find(file => files.includes(file));

    if (found === undefined) {
      return null;
    }

    return join(configDir, found);
  } catch (error) {
    if (errorHaveCode(error) && error.code === 'ENOENT') {
      throw new Error(`config directory ${configDir} not found`);
    }

    if (errorHaveCode(error)) {
      throw new Error(`failed to load the config directory ${configDir}. Error: ${error.message} (${error.code})`);
    }

    throw new Error(
      `failed to load the config directory ${configDir}. Error: ${error instanceof Error ? error.message : error}`,
    );
  }
}

function loadFile(fullFileName: string) {
  try {
    return readFileSync(fullFileName, 'utf-8');
  } catch (error) {
    if (errorHaveCode(error) && error.code === 'ENOENT') {
      throw new Error(`confid file ${fullFileName} not found`);
    }

    if (errorHaveCode(error)) {
      throw new Error(`failed to read config file ${fullFileName}. Error: ${error.message} (${error.code})`);
    }

    throw new Error(
      `failed to read config file ${fullFileName}. Error: ${error instanceof Error ? error.message : error}`,
    );
  }
}

function tryParseJson5(content: string) {
  try {
    if (JSON5 === null) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      JSON5 = require('json5') as JSON;
    }

    return JSON5.parse(content);
  } catch (error) {
    return null;
  }
}

function parseFile(content: string) {
  try {
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const parsed = tryParseJson5(content);
      if (parsed !== null) {
        return parsed;
      }
    }
    throw error;
  }
}

export function jsonFileLoader(configDir?: string, baseName?: string): ConfigLoader {
  const baseNames: string[] = [];

  // if a basename is passed, we only use it.
  // This avoid mistakes like expecting to load the file provided but
  // instead load the file based on NODE_ENV.
  if (baseName !== undefined) {
    baseNames.push(baseName);
  } else {
    const env = getEnvOrDefault('NODE_ENV', 'development');
    baseNames.push(env, `${env}.local`);
  }

  const dir = configDir ?? join(process.cwd(), 'config');

  return {
    load: () => {
      const file = locateMatchingFile(dir, baseNames);
      if (file === null) {
        throw new Error(`config file not found. Searched for ${getFilesAllowed(baseNames).join(', ')}`);
      }
      const content = loadFile(file);
      const result = parseFile(content);
      if (typeof result === 'object' && result !== null) {
        return result;
      }
      throw new Error(`config file ${file} returned an invalid json object ${result}`);
    },
    identifier: `jsonFileLoader(${dir}, [${baseNames.join(', ')}])`,
  };
}
