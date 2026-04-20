import "./setup.js";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyPackageChanges,
  findBranchForVersion,
} from "../../overlay/www/js/package-changes-core.js";
import {
  createPackageChangesService,
  resolveBranchesUrl,
} from "../../overlay/www/js/package-changes.js";

describe("package changes core", () => {
  it("applies rename, add and delete entries", () => {
    const packages = ["base-files", "opkg", "busybox"];
    const changes = [
      { source: "opkg", target: "apk-mbedtls" },
      { source: "luci-app-diag-core" },
      { target: "busybox" },
    ];

    assert.deepEqual(applyPackageChanges(packages, changes), [
      "base-files",
      "apk-mbedtls",
      "luci-app-diag-core",
    ]);
  });

  it("does not force rename target when source is absent", () => {
    const packages = ["base-files"];
    const changes = [{ source: "opkg", target: "apk-mbedtls" }];

    assert.deepEqual(applyPackageChanges(packages, changes), ["base-files"]);
  });

  it("finds matching branch by series", () => {
    const branch = findBranchForVersion(
      [
        { name: "24.10", package_changes: [{ source: "a" }] },
        { name: "SNAPSHOT", package_changes: [{ source: "b" }] },
      ],
      "24.10.6"
    );

    assert.equal(branch?.name, "24.10");
  });

  it("maps snapshot-like versions to SNAPSHOT branch", () => {
    const branch = findBranchForVersion(
      [{ name: "SNAPSHOT", package_changes: [] }],
      "25.12-SNAPSHOT"
    );

    assert.equal(branch?.name, "SNAPSHOT");
  });
});

describe("package changes service", () => {
  it("resolves branches url from custom config first", () => {
    const url = resolveBranchesUrl(
      { asu_url: "https://sysupgrade.openwrt.org" },
      { asu_branches_url: "https://example.com/branches.json" }
    );
    assert.equal(url, "https://example.com/branches.json");
  });

  it("falls back to asu_url json endpoint", () => {
    const url = resolveBranchesUrl({ asu_url: "https://sysupgrade.openwrt.org/" });
    assert.equal(url, "https://sysupgrade.openwrt.org/json/v1/branches.json");
  });

  it("applies branch changes returned by API", async () => {
    const fetchCalls = [];
    const service = createPackageChangesService({
      branchesUrl: "https://example.com/branches.json",
      fetchFn: async (url) => {
        fetchCalls.push(url);
        return {
          status: 200,
          json: async () => [
            {
              name: "24.10",
              package_changes: [{ source: "opkg", target: "apk-mbedtls" }],
            },
          ],
        };
      },
    });

    const result = await service.applyForVersion(["base-files", "opkg"], "24.10.4");
    assert.deepEqual(result, ["base-files", "apk-mbedtls"]);
    assert.equal(fetchCalls.length, 1);
  });

  it("keeps package list unchanged on fetch error", async () => {
    const service = createPackageChangesService({
      branchesUrl: "https://example.com/branches.json",
      fetchFn: async () => {
        throw new Error("network down");
      },
    });

    const result = await service.applyForVersion(["base-files"], "24.10.4");
    assert.deepEqual(result, ["base-files"]);
  });
});
