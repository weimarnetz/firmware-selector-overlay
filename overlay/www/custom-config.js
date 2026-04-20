/* exported customConfig */

var customConfig = {
  keep_asu_open: true,
  /** Katalog-Downloads (Sysupgrade, Kernel, …) ausblenden; ASU-Build-Links bleiben sichtbar. */
  hide_catalog_firmware_downloads: true,
  hide_static_footer_links: true,
  show_uci_defaults_editor: false,
  community_placeholder: "Keine Community",
  /* id = Profilname ohne Präfix profile_ (entspricht option name in /etc/config/freifunk) */
  communities: [
    { id: "Camburg", label: "Camburg" },
    { id: "Gransee", label: "Gransee" },
    { id: "Meusebach_indoor", label: "Meusebach (indoor)" },
    { id: "Meusebach_outdoor", label: "Meusebach (outdoor)" },
    { id: "Saalebogen_indoor", label: "Saalebogen (indoor)" },
    { id: "Saalebogen_outdoor", label: "Saalebogen (outdoor)" },
    { id: "Saalfeld", label: "Saalfeld" },
    { id: "Weimar", label: "Weimar" },
    { id: "Weimar_indoor", label: "Weimar (indoor)" },
  ],
  community_command_template:
    '[ -n "$(uci -q get freifunk.community.name 2>/dev/null)" ] && exit 0\n' +
    "uci -m import freifunk < /dev/null\n" +
    "uci -q show freifunk.community >/dev/null 2>&1 || uci set freifunk.community=public\n" +
    "uci set freifunk.community.name='${community}'\n" +
    "uci commit freifunk",
};
