import { describe, expect, it } from "vitest";
import { formString, scalarString } from "./safe-string";

describe("formString", () => {
  it("returns string fields and ignores files", () => {
    const form = new FormData();
    form.set("name", "Ada");
    form.set("avatar", new File(["x"], "a.png"));
    expect(formString(form, "name")).toBe("Ada");
    expect(formString(form, "avatar")).toBe("");
    expect(formString(form, "missing")).toBe("");
  });
});

describe("scalarString", () => {
  it("stringifies scalars and drops objects", () => {
    expect(scalarString("ok")).toBe("ok");
    expect(scalarString(3)).toBe("3");
    expect(scalarString(true)).toBe("true");
    expect(scalarString(null)).toBe("");
    expect(scalarString({ a: 1 })).toBe("");
  });
});
