<div align="center">
    <h1 align="center">Typesafe Config</h1>
    <h5>Avoid getting invalid configuration inside your application</h5>
</div>
<br/>

## 🔗 Quick Links

> - [📍 Overview](#-overview)
> - [📦 Features](#-features)
> - [🚀 Getting Started](#-getting-started)
>   - [⚙️ Installation](#-installation)
>   - [🧪 Tests](#-tests)
>   - [🚀 Examples](#-examples)

## 📍 Overview

Typesafe Config is a library that allows you get your configuration in a typesafe way.
It will get your configuration from muiltiple sources, merge them together and validate them against your schema provided.

## 📦 Features

- [x] Get and merge configuration data from multiple sources
- [x] Environment variables loader
- [x] JSON file loader
- [ ] AWS Secrets Manager loader
- [ ] AWS Parameter Store loader
- [x] Validate configuration data against a schema and retur the validated data with the types inferred
- [x] Helper function to get the list of full qualified names used by the K/V loaders (env, AWS SM)
- [x] Support zod schemas
- [ ] Add support for other schema validators (io-ts, yup, etc)

## 🚀 Getting Started

### ⚙️ Installation

Installing the core package give you the basic functions and loaders to get your configuration data.

```bash
npm install @typesafe-config/core
```

### 🧪 Tests

We use nx to manage our monorepo and run our tests. you can run just the affected tests or the tests for a specific package:

```bash
npm run affected:test
```

or

```bash
npm run test core --watch ...
```

### 🚀 Examples

#### Basic usage

```typescript
import { z } from 'zod';
import { resolve } from 'path';
import { createConfig, environmentVariablesLoader, jsonFileLoader } from '@typesafe-config/core';

const baseDir = resolve(__dirname, './config');
const config = await createConfig(
  'zod',
  z.object({
    db: z.object({ url: z.string() }),
    port: z.number(),
    nested: z.object({ foo: z.object({ bar: z.string() }) }),
  }),
  [
    // Load the file default.json or default.json5 from the baseDir
    jsonFileLoader(baseDir, 'default'),
    // Load specific configs for the current environment
    jsonFileLoader(baseDir, process.env.NODE_ENV || 'development'),
    // Last overrides from environment variables
    environmentVariablesLoader(process.env),
  ],
);

// Now you can use your configuration data with the types inferred
console.log(config.db.url);
//...
```

#### Using optional hooks

```typescript
import { z } from 'zod';
import { resolve } from 'path';
import { createConfig, environmentVariablesLoader } from '@typesafe-config/core';

const config = await createConfig(
  'zod',
  z.object({
    db: z.object({ url: z.string() }),
    port: z.number(),
    nested: z.object({ foo: z.object({ bar: z.string() }) }),
  }),
  [environmentVariablesLoader(process.env)],
  {
    onValidationError: (error, dataLoaded) => {
      // You will receive the error from the schema validation library and the data loaded so far
    },

    // If you pass an onDataloaderError function, the createConfig will not throw an error if one of the loaders fail
    // and will try to validate the data that was possible to load.
    onDataLoaderError: (error: Error) => {
      // You will receive the error from the data loader
    },
  },
);
```

#### Getting the list of full qualified names used by the K/V loaders (env, AWS SM)

```typescript
import { z } from 'zod';
import { resolve } from 'path';
import { getConfigKeysInfo, environmentVariablesLoader } from '@typesafe-config/core';

const dir = resolve(__dirname, './config');
const info = await getConfigKeysInfo(
  'zod',
  z.object({
    db: z.object({ url: z.string() }),
    port: z.number(),
    nested: z.object({ foo: z.object({ bar: z.string() }) }),
  }),
  [
    // you can pass the loaders to get the information of what loaders was used for each key
    // It's important to pass the loaders in the same order that you pass to the createConfig function
    jsonFileLoader(dir, 'default'),
    environmentVariablesLoader(process.env),
  ],
);

console.log(info);
// [
//   { key: 'DB_URL', loader: 'environmentVariablesLoader', path: ['db', 'url'] },
//   {
//     key: 'PORT',
//     loader: 'jsonFileLoader(/your/config/directory, [default])',
//     path: ['port'],
//   },
//   {
//     key: 'NESTED_FOO_BAR',
//     loader: 'jsonFileLoader(/your/config/directory, [default])',
//     path: ['nested', 'foo', 'bar'],
//   },
// ]

}
```
