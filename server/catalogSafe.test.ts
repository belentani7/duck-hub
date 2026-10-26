import { describe, expect, it } from "vitest";
import { catalogDetailsUrl, catalogLicenseState, parseCents, escapeHtml, safeBpm, safeCents } from "../src/lib/catalogSafe";

describe("public catalog HTML and navigation safety", () => {
  it("escapes attacker-controlled text in HTML and attributes", () => {
    const hostile = `<img src=x onerror="alert(1)">&'"`;
    expect(escapeHtml(hostile)).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;&quot;");
    expect(escapeHtml(null)).toBe("");
  });
  it("rejects invalid prices and tempo", () => {
    expect(safeCents("-42")).toBe(0);
    expect(safeCents("Infinity")).toBe(0);
    expect(safeCents(1250)).toBe(1250);
    expect(safeBpm("180")).toBe("180");
    expect(safeBpm("900")).toBe("—");
    expect(safeBpm("NaN")).toBe("—");
  });
  it("keeps catalog details within a project Pages base", () => {
    expect(catalogDetailsUrl("/duck-hub/", 'a&b')).toBe("/duck-hub/catalog/?beat=a%26b");
    expect(catalogDetailsUrl("/", "sinal")).toBe("/catalog/?beat=sinal");
  });
  it("does not present missing or invalid catalog prices as free offers", () => {
    for (const value of [null, undefined, "", " ", "-42", "Infinity", "NaN", "0x10", "1.2", -1, 1.2, Infinity, NaN, 9007199254740992, {}, true]) {
      expect(parseCents(value)).toBeNull();
    }
    expect(parseCents(0)).toBe(0);
    expect(parseCents("0")).toBe(0);
    expect(parseCents(1250)).toBe(1250);
    expect(parseCents("1250")).toBe(1250);
  });

  it("disables purchase when all prices are missing or beat is reserved", () => {
    expect(catalogLicenseState("available", null, undefined)).toEqual({
      nonExclusiveCents: null, exclusiveCents: null, initialLicense: null, canBuy: false,
    });
    expect(catalogLicenseState("available", -1, 1250)).toEqual({
      nonExclusiveCents: null, exclusiveCents: 1250, initialLicense: "exclusive", canBuy: true,
    });
    expect(catalogLicenseState("reserved", 0, 1200).canBuy).toBe(false);
    expect(catalogLicenseState("available", 0, 1200).canBuy).toBe(true);
  });

});
