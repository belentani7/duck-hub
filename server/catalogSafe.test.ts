import { describe, expect, it } from "vitest";
import { catalogDetailsUrl, escapeHtml, safeBpm, safeCents } from "../src/lib/catalogSafe";

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
});
