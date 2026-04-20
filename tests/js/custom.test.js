import "./setup.js";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  communityBlockEnd,
  communityBlockStart,
  mergeCommunityDefaults,
  renderCommunityCommand,
} from "../../overlay/www/js/custom-core.js";

describe("custom community defaults", () => {
  it("renders command from template and community", () => {
    const command = renderCommunityCommand(
      "uci set foo.bar='${community}'",
      "weimar"
    );
    assert.equal(command, "uci set foo.bar='weimar'");
  });

  it("adds managed block when community is selected", () => {
    const merged = mergeCommunityDefaults("echo hello", "uci set test='weimar'");
    assert.equal(
      merged,
      [
        "echo hello",
        "",
        communityBlockStart,
        "uci set test='weimar'",
        communityBlockEnd,
      ].join("\n")
    );
  });

  it("replaces existing managed block when community changes", () => {
    const source = [
      "echo hello",
      "",
      communityBlockStart,
      "uci set test='weimar'",
      communityBlockEnd,
    ].join("\n");
    const merged = mergeCommunityDefaults(source, "uci set test='saalfeld'");
    assert.equal(
      merged,
      [
        "echo hello",
        "",
        communityBlockStart,
        "uci set test='saalfeld'",
        communityBlockEnd,
      ].join("\n")
    );
  });

  it("removes managed block when no community is selected", () => {
    const source = [
      "echo hello",
      "",
      communityBlockStart,
      "uci set test='weimar'",
      communityBlockEnd,
    ].join("\n");
    const merged = mergeCommunityDefaults(source, "");
    assert.equal(merged, "echo hello");
  });
});
