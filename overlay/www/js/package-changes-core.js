function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeSeries(version) {
  const raw = normalizeString(version);
  if (!raw) {
    return "";
  }
  if (raw.toUpperCase().includes("SNAPSHOT")) {
    return "SNAPSHOT";
  }
  const match = raw.match(/^(\d+\.\d+)/);
  return match ? match[1] : raw;
}

export function splitPackageText(value) {
  return normalizeString(value)
    .split(/\s+/)
    .map((pkg) => pkg.trim())
    .filter(Boolean);
}

export function uniquePackages(packages) {
  const seen = new Set();
  const normalized = [];
  for (const pkg of Array.isArray(packages) ? packages : []) {
    if (typeof pkg !== "string") {
      continue;
    }
    const name = pkg.trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    normalized.push(name);
  }
  return normalized;
}

export function removePackage(packages, packageName) {
  const target = normalizeString(packageName);
  if (!target) {
    return { packages: uniquePackages(packages), removed: false };
  }

  const result = [];
  let removed = false;
  for (const pkg of uniquePackages(packages)) {
    if (pkg === target) {
      removed = true;
      continue;
    }
    result.push(pkg);
  }

  return { packages: result, removed };
}

export function addPackage(packages, packageName) {
  const list = uniquePackages(packages);
  const target = normalizeString(packageName);
  if (!target || list.includes(target)) {
    return list;
  }
  return list.concat(target);
}

export function applyPackageChanges(packages, packageChanges) {
  let result = uniquePackages(packages);

  for (const change of Array.isArray(packageChanges) ? packageChanges : []) {
    const source = normalizeString(change?.source);
    const target = normalizeString(change?.target);

    if (source && target) {
      const removed = removePackage(result, source);
      result = removed.removed ? addPackage(removed.packages, target) : removed.packages;
      continue;
    }

    if (source) {
      result = addPackage(result, source);
      continue;
    }

    if (target) {
      result = removePackage(result, target).packages;
    }
  }

  return result;
}

export function findBranchForVersion(branches, version) {
  const targetSeries = normalizeSeries(version);
  if (!targetSeries) {
    return null;
  }

  const list = Array.isArray(branches) ? branches : [];
  const byName = list.find((entry) => normalizeSeries(entry?.name) === targetSeries);
  if (byName) {
    return byName;
  }

  return (
    list.find((entry) =>
      Array.isArray(entry?.versions)
        ? entry.versions.some((v) => normalizeSeries(v) === targetSeries)
        : false
    ) || null
  );
}
