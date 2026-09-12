import { describe, expect, it } from "vitest";
import { displayName, splitDisplayName } from "./profile-name";

describe("splitDisplayName", () => {
  it("splits on the first space", () => {
    expect(splitDisplayName("Jeanne Martin")).toEqual({
      firstName: "Jeanne",
      lastName: "Martin",
    });
  });

  it("keeps extra words in the last name", () => {
    expect(splitDisplayName("Jean Pierre Dupont")).toEqual({
      firstName: "Jean",
      lastName: "Pierre Dupont",
    });
  });

  it("puts a single word in the first name", () => {
    expect(splitDisplayName("Jeanne")).toEqual({ firstName: "Jeanne", lastName: "" });
  });
});

describe("displayName", () => {
  it("joins first and last name", () => {
    expect(displayName("Jeanne", "Martin")).toBe("Jeanne Martin");
  });
});
