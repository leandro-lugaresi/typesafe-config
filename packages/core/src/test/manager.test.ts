import { describe, expect, test } from "@jest/globals";
import { z } from "zod";
import { ConfigManager } from "../manager";

describe("ConfigManager", () => {
  test.skip("should be able to load config", async () => {
    const manager = new ConfigManager({
      schema: {
        db: z.object({ url: z.string() }),
        port: z.number(),
        nested: z.object({ foo: z.object({ bar: z.string() }) }),
      },
      loaders: [],
    });
    await manager.init();
    expect(manager.values()).toEqual({ foo: "bar" });
  });
});
