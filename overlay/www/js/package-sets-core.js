import { splitPackageText, uniquePackages } from "./package-changes-core.js";

export function findPackageSet(sets, id) {
  const target = String(id || "").trim();
  if (!target) {
    return null;
  }
  const list = Array.isArray(sets) ? sets : [];
  return list.find((set) => String(set?.id || "").trim() === target) || null;
}

/** Normalisiert eine Paketliste (String oder Array) zu einem dedupten, leerzeichengetrennten String. */
export function normalizePackageList(value) {
  const packages = Array.isArray(value) ? value : splitPackageText(value);
  return uniquePackages(packages).join(" ");
}
