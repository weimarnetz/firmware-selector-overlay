import { $, $$, hide, show } from "./utils.js";
import {
  communityBlockEnd,
  communityBlockStart,
  isAsuFirmwareStoreHref,
  mergeCommunityDefaults,
  renderCommunityCommand,
} from "./custom-core.js";
import { splitPackageText } from "./package-changes-core.js";
import {
  createPackageChangesService,
  resolveBranchesUrl,
} from "./package-changes.js";
import {
  applyPackageSetDelta,
  findPackageSet,
  normalizePackageList,
} from "./package-sets-core.js";

export {
  communityBlockEnd,
  communityBlockStart,
  isAsuFirmwareStoreHref,
  mergeCommunityDefaults,
  renderCommunityCommand,
};

function setupUciDefaultsToggle(customConfig) {
  const toggle = $("#uci-defaults-toggle");
  if (!toggle) {
    return;
  }

  toggle.open = customConfig.show_uci_defaults_editor === true;
}

/**
 * Versteckt Sysupgrade-/Kernel-Links vom OpenWrt-Katalog, lässt aber fertige ASU-Images
 * stehen (gleiche Tabelle; ASU-Ordner enthält „/store/“). Läuft per queueMicrotask nach
 * dem letzten DOM-Mutationsschritt von updateImages, damit nicht zeilenweise geleert wird.
 */
function setupCatalogDownloadFilter(customConfig) {
  if (!customConfig?.hide_catalog_firmware_downloads) {
    return;
  }

  const table = $("#download-table1");
  if (!table) {
    return;
  }

  let queued = false;
  const apply = () => {
    queued = false;
    const folder = $("#image-folder");
    const href =
      folder && "href" in folder ? String(folder.href || "") : "";
    const showBlock = isAsuFirmwareStoreHref(href);

    if (showBlock) {
      const d1 = $("#downloads1");
      const d2 = $("#downloads2");
      if (d1) {
        d1.classList.remove("hide");
        d1.style.removeProperty("display");
      }
      if (d2) {
        d2.classList.remove("hide");
        d2.style.removeProperty("display");
        /* Upstream: downloads2 ist nur für schmale Viewports; ohne display:none erscheint
           dieselbe SYSUPGRADE-Zeile doppelt (Tabelle + download-links2). */
        d2.style.display = "none";
      }
      return;
    }

    for (const sel of ["#downloads1", "#downloads2"]) {
      const el = $(sel);
      if (!el) {
        continue;
      }
      el.classList.add("hide");
      el.style.setProperty("display", "none", "important");
    }

    $$("#download-table1 *").forEach((e) => e.remove());
    $$("#download-links2 *").forEach((e) => e.remove());
    $$("#download-extras2 *").forEach((e) => e.remove());
  };

  const schedule = () => {
    if (queued) {
      return;
    }
    queued = true;
    queueMicrotask(() => {
      apply();
    });
  };

  new MutationObserver(schedule).observe(table, {
    childList: true,
    subtree: true,
  });
}

function setupCommunitySelector(customConfig) {
  const group = $("#community-group");
  const select = $("#community-select");
  const defaultsTextarea = $("#uci-defaults-content");
  const communities = customConfig.communities || [];

  if (!group || !select || !defaultsTextarea || communities.length === 0) {
    if (group) {
      hide(group);
    }
    return;
  }

  show(group);
  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.innerText =
    customConfig.community_placeholder || "Keine Community";
  select.appendChild(placeholderOption);

  for (const community of communities) {
    const option = document.createElement("option");
    option.value = community.id;
    option.innerText = community.label;
    select.appendChild(option);
  }

  select.addEventListener("change", () => {
    const command = renderCommunityCommand(
      customConfig.community_command_template,
      select.value
    );
    defaultsTextarea.value = mergeCommunityDefaults(defaultsTextarea.value, command);
  });
}

/**
 * Paketsatz-Auswahl: wendet ein Profil als Delta (add/remove) auf die Gerätevorgabe an.
 * Die erste Option stellt die Gerätevorgabe wieder her. Bei Geräte-/Versionswechsel
 * schreibt Upstream die Default-Pakete neu; wir snapshotten diese (und re-applyen ein
 * aktives Profil), damit Treiber gerätespezifisch bleiben.
 */
function setupPackageSets(customConfig, packageChangesApi) {
  const group = $("#package-set-group");
  const select = $("#package-set-select");
  const packageInput = $("#asu-packages");
  const sets = customConfig.package_sets || [];

  if (!group || !select || !packageInput || sets.length === 0) {
    if (group) {
      hide(group);
    }
    return;
  }

  show(group);
  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.innerText =
    customConfig.package_set_placeholder || "Standard (Gerätevorgabe)";
  select.appendChild(placeholderOption);

  for (const set of sets) {
    const option = document.createElement("option");
    option.value = set.id;
    option.innerText = set.label;
    select.appendChild(option);
  }

  let deviceDefault = packageInput.value || "";
  let currentSetId = "";
  let snapshotTimer = null;

  /* Delta auf Gerätevorgabe, danach Versions-Mapping (package_changes). */
  const applySet = (set) => {
    packageInput.value = applyPackageSetDelta(deviceDefault, set);
    if (packageChangesApi) {
      void packageChangesApi.applyToTextarea();
    }
  };

  const refreshDefault = () => {
    deviceDefault = packageInput.value || "";
    if (currentSetId) {
      const set = findPackageSet(sets, currentSetId);
      if (set) {
        applySet(set);
      }
    }
  };

  const scheduleRefresh = () => {
    if (snapshotTimer) {
      clearTimeout(snapshotTimer);
    }
    /* Nach package-changes (50 ms Debounce) laufen, damit der Snapshot den
       versions-gemappten Default erfasst. */
    snapshotTimer = setTimeout(() => {
      snapshotTimer = null;
      refreshDefault();
    }, 60);
  };

  select.addEventListener("change", () => {
    const set = findPackageSet(sets, select.value);
    if (!set) {
      currentSetId = "";
      packageInput.value = normalizePackageList(deviceDefault);
      return;
    }
    if (!currentSetId) {
      deviceDefault = packageInput.value || "";
    }
    currentSetId = set.id;
    applySet(set);
  });

  const versionSelect = $("#versions");
  const modelsInput = $("#models");
  const imageVersion = $("#image-version");
  const imageCode = $("#image-code");

  if (versionSelect) {
    versionSelect.addEventListener("change", scheduleRefresh);
  }
  if (modelsInput) {
    modelsInput.addEventListener("change", scheduleRefresh);
  }
  if (imageVersion && imageCode) {
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(imageVersion, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    observer.observe(imageCode, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
}

function setupPackageChanges(customConfig) {
  const config = window.config || {};
  const branchesUrl = resolveBranchesUrl(config, customConfig || {});
  if (!branchesUrl) {
    return null;
  }

  const packageInput = $("#asu-packages");
  const versionSelect = $("#versions");
  const modelsInput = $("#models");
  const imageVersion = $("#image-version");
  const imageCode = $("#image-code");
  if (!packageInput || !versionSelect) {
    return null;
  }

  const packageChanges = createPackageChangesService({ branchesUrl });
  let applyToken = 0;
  let applyTimer = null;

  const applyToTextarea = async () => {
    const packages = splitPackageText(packageInput.value);
    if (packages.length === 0) {
      return;
    }
    const token = ++applyToken;
    const nextPackages = await packageChanges.applyForVersion(
      packages,
      versionSelect.value
    );
    if (token !== applyToken) {
      return;
    }
    const nextValue = nextPackages.join(" ");
    if (nextValue !== packageInput.value) {
      packageInput.value = nextValue;
    }
  };

  const scheduleApply = () => {
    if (applyTimer) {
      clearTimeout(applyTimer);
    }
    applyTimer = setTimeout(() => {
      applyTimer = null;
      void applyToTextarea();
    }, 50);
  };

  void packageChanges.loadBranches();
  scheduleApply();

  versionSelect.addEventListener("change", scheduleApply);

  if (modelsInput) {
    modelsInput.addEventListener("change", scheduleApply);
  }

  if (imageVersion && imageCode) {
    const observer = new MutationObserver(() => scheduleApply());
    observer.observe(imageVersion, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    observer.observe(imageCode, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  return { applyToTextarea, scheduleApply };
}

export function initCustomFeatures(customConfig) {
  const effectiveConfig = customConfig || {};

  if (effectiveConfig.hide_static_footer_links) {
    const footer = $("#footer");
    if (footer) {
      hide(footer);
    }
  }

  setupUciDefaultsToggle(effectiveConfig);
  setupCatalogDownloadFilter(effectiveConfig);
  setupCommunitySelector(effectiveConfig);
  const packageChangesApi = setupPackageChanges(effectiveConfig);
  setupPackageSets(effectiveConfig, packageChangesApi);
}
