import { describe, expect, test } from "@jest/globals";
import { z } from "zod";
import { EnvLoader } from "../env";

describe("EnvLoader", () => {
  test("EnvLoader must be compatible with process.env", async () => {
    const schema = {
      node_env: z.string(),
    };

    process.env.NODE_ENV = "test";

    const loader = new EnvLoader(process.env);
    const result = await loader.load(schema);
    expect(result).toEqual({
      node_env: "test",
    });
  });

  test("load should be able to get the values from environment variables", async () => {
    const schema = {
      db: z.object({ url: z.string() }),
      port: z.number(),
      nested: z.object({ foo: z.object({ bar: z.string() }) }),
    };

    const envs = {
      DB_URL: "postgres://localhost:5432",
      PORT: "3000",
      NESTED_FOO_BAR: "baz",
      NESTED_FOO_BAZ: "bar", // This should be ignored
    };

    const loader = new EnvLoader(envs);
    const result = await loader.load(schema);
    expect(result).toEqual({
      db: { url: "postgres://localhost:5432" },
      // The source don't convert any value and just return the raw values
      // (string for environment variables)
      port: "3000",
      nested: { foo: { bar: "baz" } },
    });
  });

  test('load should work if the schema have variables in "ENV_CASE"', async () => {
    const schema = {
      DB_URL: z.string(),
      PORT: z.number(),
      nested: z.object({ foo: z.object({ bar: z.string() }) }),
    };

    const envs = {
      DB_URL: "postgres://localhost:5432",
      PORT: "3000",
      NESTED_FOO_BAR: "baz",
      NESTED_FOO_BAZ: "bar", // This should be ignored
    };

    const loader = new EnvLoader(envs);
    const result = await loader.load(schema);
    expect(result).toEqual({
      DB_URL: "postgres://localhost:5432",
      // The source don't convert any value and just return the raw values
      // (string for environment variables)
      PORT: "3000",
      nested: { foo: { bar: "baz" } },
    });
  });

  test("environmentNames should return the environment variables names based on the schema passed", async () => {
    const schema = {
      db: z.object({ url: z.string() }),
      port: z.number(),
      nested: z.object({ foo: z.object({ bar: z.string() }) }),
    };

    const envs = {};

    const loader = new EnvLoader(envs);
    const result = loader.environmentNames(schema);
    expect(result).toEqual(["DB_URL", "PORT", "NESTED_FOO_BAR"]);
  });
});
