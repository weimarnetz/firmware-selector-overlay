import {
  addPackage,
  removePackage,
  splitPackageText,
  uniquePackages,
} from "./package-changes-core.js";

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

function normalizeNameList(value) {
  if (Array.isArray(value)) {
    return uniquePackages(
      value
        .filter((pkg) => typeof pkg === "string")
        .map((pkg) => pkg.trim())
        .filter(Boolean)
    );
  }
  return splitPackageText(value);
}

/**
 * Liest add/remove aus einem Package-Set.
 * Namen in remove dürfen optional mit "-" präfixiert sein.
 * Legacy: packages als Leerzeichen-getrennte Delta-Tokens ("foo -bar").
 */
export function resolvePackageSetDelta(set) {
  const add = [];
  const remove = [];

  for (const pkg of normalizeNameList(set?.remove)) {
    const name = pkg.startsWith("-") ? pkg.slice(1).trim() : pkg;
    if (name) {
      remove.push(name);
    }
  }

  for (const pkg of normalizeNameList(set?.add)) {
    if (pkg.startsWith("-")) {
      const name = pkg.slice(1).trim();
      if (name) {
        remove.push(name);
      }
      continue;
    }
    add.push(pkg);
  }

  for (const pkg of splitPackageText(set?.packages || "")) {
    if (pkg.startsWith("-")) {
      const name = pkg.slice(1).trim();
      if (name) {
        remove.push(name);
      }
      continue;
    }
    add.push(pkg);
  }

  return {
    add: uniquePackages(add),
    remove: uniquePackages(remove),
  };
}

/**
 * Wendet ein Package-Set als Delta auf die Gerätevorgabe an (remove, dann add).
 * Ersetzt die Basisliste nicht — so bleiben gerätespezifische Treiber erhalten.
 */
export function applyPackageSetDelta(basePackages, set) {
  let result = uniquePackages(
    Array.isArray(basePackages) ? basePackages : splitPackageText(basePackages)
  );
  const { add, remove } = resolvePackageSetDelta(set);

  for (const pkg of remove) {
    result = removePackage(result, pkg).packages;
  }
  for (const pkg of add) {
    result = addPackage(result, pkg);
  }

  return result.join(" ");
}
