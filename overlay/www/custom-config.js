/* exported customConfig */

var customConfig = {
  keep_asu_open: true,
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
    "uci set freifunk.community.name='${community}'\nuci commit freifunk",
};
