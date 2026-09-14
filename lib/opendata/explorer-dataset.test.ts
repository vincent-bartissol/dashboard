import { describe, expect, it } from "vitest";
import { toExplorerDataset } from "./client";
import { DATASETS } from "./datasets";

describe("toExplorerDataset", () => {
  it("drops district functions so the payload can cross the client boundary", () => {
    const client = toExplorerDataset(DATASETS.velib);
    expect(client.id).toBe(DATASETS.velib.id);
    expect(client.columns).toEqual(DATASETS.velib.columns);
    expect(client).not.toHaveProperty("district");
    expect(client).not.toHaveProperty("defaultWhere");
    expect(client).not.toHaveProperty("revalidate");
    expect(JSON.parse(JSON.stringify(client))).toEqual(client);
  });
});
