export const communityBlockStart = "# --- custom-community:start ---";
export const communityBlockEnd = "# --- custom-community:end ---";

/** True, wenn der Image-Ordner von ASU stammt (Upstream setzt …/store/… nach dem Build). */
export function isAsuFirmwareStoreHref(href) {
  if (!href || typeof href !== "string") {
    return false;
  }
  return href.includes("/store/");
}

export function renderCommunityCommand(template, communityId) {
  if (!template || !communityId) {
    return "";
  }

  return template.replaceAll("${community}", communityId);
}

export function mergeCommunityDefaults(defaultsText, command) {
  const source = defaultsText || "";
  const blockRe = new RegExp(
    `${communityBlockStart}[\\s\\S]*?${communityBlockEnd}\\n?`,
    "g"
  );
  const withoutManagedBlock = source.replace(blockRe, "").trim();

  if (!command) {
    return withoutManagedBlock;
  }

  const managedBlock = [
    communityBlockStart,
    command.trim(),
    communityBlockEnd,
  ].join("\n");

  if (!withoutManagedBlock) {
    return managedBlock;
  }

  return `${withoutManagedBlock}\n\n${managedBlock}`;
}
