import {
  applyPackageChanges,
  findBranchForVersion,
  uniquePackages,
} from "./package-changes-core.js";

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

export function resolveBranchesUrl(config, customConfig) {
  const customUrl = normalizeUrl(customConfig?.asu_branches_url);
  if (customUrl) {
    return customUrl;
  }

  const configUrl = normalizeUrl(config?.asu_branches_url);
  if (configUrl) {
    return configUrl;
  }

  const asuUrl = normalizeUrl(config?.asu_url);
  return asuUrl ? `${asuUrl}/json/v1/branches.json` : "";
}

export function createPackageChangesService(options) {
  const fetchFn = options?.fetchFn || fetch;
  const branchesUrl = options?.branchesUrl || "";

  let cache = null;
  let inFlight = null;

  async function loadBranches() {
    if (!branchesUrl) {
      return [];
    }

    if (Array.isArray(cache)) {
      return cache;
    }

    if (inFlight) {
      return inFlight;
    }

    inFlight = fetchFn(branchesUrl, { cache: "no-cache" })
      .then((response) => {
        if (!response || response.status !== 200) {
          throw new Error(`Failed to fetch ${branchesUrl}`);
        }
        return response.json();
      })
      .then((data) => {
        cache = Array.isArray(data) ? data : [];
        return cache;
      })
      .catch(() => {
        cache = [];
        return cache;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  }

  async function applyForVersion(packages, version) {
    const branches = await loadBranches();
    const branch = findBranchForVersion(branches, version);
    if (!branch || !Array.isArray(branch.package_changes)) {
      return uniquePackages(packages);
    }
    return applyPackageChanges(packages, branch.package_changes);
  }

  return {
    applyForVersion,
    loadBranches,
  };
}
