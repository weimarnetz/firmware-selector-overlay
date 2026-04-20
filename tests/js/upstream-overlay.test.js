import { describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, cpSync, existsSync } from "node:fs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const lockFile = path.join(repoRoot, "upstream.lock.yml");
const overlayDir = path.join(repoRoot, "overlay", "www");

function readLock() {
  const content = readFileSync(lockFile, "utf8");
  const repository = content.match(/^\s*repository:\s*(.+)$/m)?.[1]?.trim();
  const commit = content.match(/^\s*commit:\s*([a-f0-9]{40})$/m)?.[1]?.trim();
  if (!repository || !commit) {
    throw new Error("Konnte upstream.lock.yml nicht lesen.");
  }
  return { repository, commit };
}

function resolveUpstreamDir() {
  if (process.env.UPSTREAM_DIR) {
    return path.resolve(process.cwd(), process.env.UPSTREAM_DIR);
  }
  const ciCheckout = path.join(repoRoot, "upstream-src");
  if (existsSync(ciCheckout)) {
    return ciCheckout;
  }
  return path.resolve(repoRoot, "../firmware-selector-openwrt-org");
}

function gitHead(dir) {
  return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
}

function mergeOverlayIntoTemp(upstreamDir) {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "fw-overlay-"));
  const mergedWww = path.join(tempRoot, "www");
  cpSync(path.join(upstreamDir, "www"), mergedWww, { recursive: true });
  cpSync(overlayDir, mergedWww, { recursive: true });
  return { tempRoot, mergedWww };
}

describe("upstream overlay integration", () => {
  it("uses pinned upstream commit and keeps custom DOM references valid", () => {
    const lock = readLock();
    const upstreamDir = resolveUpstreamDir();

    assert.ok(existsSync(path.join(upstreamDir, ".git")), "Upstream-Repo nicht gefunden.");
    assert.ok(existsSync(path.join(upstreamDir, "www")), "Upstream enthält kein www/-Verzeichnis.");

    const actualHead = gitHead(upstreamDir);
    assert.equal(
      actualHead,
      lock.commit,
      `Upstream-Commit stimmt nicht mit upstream.lock.yml überein. Erwartet ${lock.commit}, gefunden ${actualHead}.`
    );

    const { tempRoot, mergedWww } = mergeOverlayIntoTemp(upstreamDir);
    try {
      const customJs = readFileSync(path.join(mergedWww, "js", "custom.js"), "utf8");
      const customHtml = readFileSync(path.join(mergedWww, "custom.html"), "utf8");

      assert.ok(existsSync(path.join(mergedWww, "config.js")));
      assert.ok(existsSync(path.join(mergedWww, "js", "main.js")));
      assert.ok(existsSync(path.join(mergedWww, "custom-config.js")));
      assert.ok(existsSync(path.join(mergedWww, "js", "custom-bootstrap.js")));

      const selectorMatches = customJs.match(/"#[a-zA-Z0-9_-]+"/g) || [];
      const selectors = [...new Set(selectorMatches.map((value) => value.slice(1, -1)))];
      assert.ok(selectors.length > 0, "Keine ID-Selektoren in custom.js gefunden.");

      for (const selector of selectors) {
        const id = selector.slice(1);
        assert.ok(
          customHtml.includes(`id="${id}"`),
          `DOM-ID fehlt in custom.html: ${selector}`
        );
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
