import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyPackageSetDelta,
  findPackageSet,
  normalizePackageList,
  resolvePackageSetDelta,
} from "../../overlay/www/js/package-sets-core.js";

const sets = [
  {
    id: "minimal",
    label: "Minimal",
    remove: ["ppp", "firewall4"],
    add: ["olsrd", "wpad-mesh-mbedtls"],
  },
  {
    id: "expert",
    label: "Expert",
    packages: "tcpdump -dnsmasq",
  },
];

describe("findPackageSet", () => {
  it("findet ein Profil anhand der id", () => {
    assert.equal(findPackageSet(sets, "expert").label, "Expert");
  });

  it("ignoriert umgebende Leerzeichen", () => {
    assert.equal(findPackageSet(sets, "  minimal  ").id, "minimal");
  });

  it("gibt null bei leerer id zurück", () => {
    assert.equal(findPackageSet(sets, ""), null);
    assert.equal(findPackageSet(sets, null), null);
  });

  it("gibt null bei unbekannter id zurück", () => {
    assert.equal(findPackageSet(sets, "nope"), null);
  });

  it("ist robust gegen ungültige sets", () => {
    assert.equal(findPackageSet(null, "minimal"), null);
  });
});

describe("normalizePackageList", () => {
  it("normalisiert einen String zu leerzeichengetrennten Paketen", () => {
    assert.equal(
      normalizePackageList("  base-files   dnsmasq\n-ppp "),
      "base-files dnsmasq -ppp"
    );
  });

  it("akzeptiert auch ein Array", () => {
    assert.equal(
      normalizePackageList(["base-files", "dnsmasq"]),
      "base-files dnsmasq"
    );
  });

  it("entfernt Duplikate unter Beibehaltung der Reihenfolge", () => {
    assert.equal(
      normalizePackageList("dnsmasq base-files dnsmasq"),
      "dnsmasq base-files"
    );
  });

  it("behält add- und remove-Token (-paket) als eigenständige Einträge", () => {
    assert.equal(normalizePackageList("ppp -ppp"), "ppp -ppp");
  });

  it("liefert leeren String bei leerer Eingabe", () => {
    assert.equal(normalizePackageList(""), "");
    assert.equal(normalizePackageList(null), "");
  });
});

describe("resolvePackageSetDelta", () => {
  it("liest add/remove-Arrays", () => {
    assert.deepEqual(resolvePackageSetDelta(sets[0]), {
      add: ["olsrd", "wpad-mesh-mbedtls"],
      remove: ["ppp", "firewall4"],
    });
  });

  it("akzeptiert optionales Minus in remove", () => {
    assert.deepEqual(
      resolvePackageSetDelta({ remove: ["-ppp", "firewall4"] }),
      { add: [], remove: ["ppp", "firewall4"] }
    );
  });

  it("interpretiert legacy packages als Delta-Tokens", () => {
    assert.deepEqual(resolvePackageSetDelta(sets[1]), {
      add: ["tcpdump"],
      remove: ["dnsmasq"],
    });
  });
});

describe("applyPackageSetDelta", () => {
  const deviceDefault =
    "base-files dnsmasq dropbear firewall4 kmod-ath9k ppp wpad-basic-mbedtls";

  it("entfernt und ergänzt relativ zur Gerätevorgabe", () => {
    assert.equal(
      applyPackageSetDelta(deviceDefault, sets[0]),
      "base-files dnsmasq dropbear kmod-ath9k wpad-basic-mbedtls olsrd wpad-mesh-mbedtls"
    );
  });

  it("lässt gerätespezifische Pakete stehen", () => {
    const result = applyPackageSetDelta(deviceDefault, {
      remove: ["ppp"],
      add: ["olsrd"],
    });
    assert.match(result, /\bkmod-ath9k\b/);
    assert.match(result, /\bolsrd\b/);
    assert.doesNotMatch(result, /\bppp\b/);
  });

  it("ist idempotent bei erneutem Apply", () => {
    const once = applyPackageSetDelta(deviceDefault, sets[0]);
    const twice = applyPackageSetDelta(once, sets[0]);
    assert.equal(twice, once);
  });

  it("unterstützt legacy packages-String als Delta", () => {
    assert.equal(
      applyPackageSetDelta("base-files dnsmasq", { packages: "tcpdump -dnsmasq" }),
      "base-files tcpdump"
    );
  });
});
