import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findPackageSet,
  normalizePackageList,
} from "../../overlay/www/js/package-sets-core.js";

const sets = [
  { id: "minimal", label: "Minimal", packages: "base-files dnsmasq -ppp" },
  { id: "expert", label: "Expert", packages: "base-files tcpdump" },
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
