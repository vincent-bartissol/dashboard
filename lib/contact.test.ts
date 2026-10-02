import { describe, expect, it } from "vitest";
import {
  clientIpFromHeaders,
  contactTo,
  parseContactFields,
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
} from "./contact";

describe("parseContactFields", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Bonjour, j’ai une question.",
  };

  it("accepts a valid submission", () => {
    expect(parseContactFields(valid)).toEqual({
      ok: true,
      honeypot: false,
      ...valid,
    });
  });

  it("returns success without storing when honeypot is filled", () => {
    expect(parseContactFields({ ...valid, website: "http://spam.example" })).toEqual({
      ok: true,
      honeypot: true,
    });
  });

  it("rejects empty and invalid fields", () => {
    expect(parseContactFields({ ...valid, name: "  " }).ok).toBe(false);
    expect(parseContactFields({ ...valid, email: "not-an-email" })).toEqual({
      ok: false,
      error: "emailInvalid",
    });
    expect(parseContactFields({ ...valid, message: "" })).toEqual({
      ok: false,
      error: "messageRequired",
    });
  });

  it("rejects oversized fields", () => {
    expect(parseContactFields({ ...valid, name: "x".repeat(CONTACT_NAME_MAX + 1) })).toEqual({
      ok: false,
      error: "nameTooLong",
    });
    expect(
      parseContactFields({ ...valid, message: "x".repeat(CONTACT_MESSAGE_MAX + 1) }),
    ).toEqual({
      ok: false,
      error: "messageTooLong",
    });
  });

  it("trims whitespace", () => {
    const result = parseContactFields({
      name: "  Ada  ",
      email: "  ada@example.com  ",
      message: "  Hello  ",
    });
    expect(result).toEqual({
      ok: true,
      honeypot: false,
      name: "Ada",
      email: "ada@example.com",
      message: "Hello",
    });
  });
});

describe("clientIpFromHeaders", () => {
  it("prefers the last x-forwarded-for hop", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.1, 198.51.100.7",
      "x-real-ip": "10.0.0.1",
    });
    expect(clientIpFromHeaders(headers)).toBe("198.51.100.7");
  });

  it("ignores trailing commas and stray spaces in x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.1,  198.51.100.7 , ",
    });
    expect(clientIpFromHeaders(headers)).toBe("198.51.100.7");
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});

describe("contactTo", () => {
  it("returns null when unset or blank", () => {
    expect(contactTo(undefined)).toBeNull();
    expect(contactTo("  ")).toBeNull();
  });

  it("keeps a configured address", () => {
    expect(contactTo("hello@example.com")).toBe("hello@example.com");
  });
});
