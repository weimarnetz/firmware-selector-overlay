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
  /* Erste Dropdown-Option: stellt die ursprünglichen Gerätepakete wieder her. */
  package_set_placeholder: "Standard (Gerätevorgabe)",
  /* Vordefinierte Paketprofile. Auswahl ersetzt den gesamten Paketlisten-Inhalt.
     packages: ASU-Paketliste (Leerzeichen-getrennt, "-paket" entfernt ein Paket).
     Weitere Profile (z. B. "standard", "expert") nach gleichem Schema ergänzen. */
  package_sets: [
    {
      id: "minimal",
      label: "Minimal",
      packages:
        "base-files ca-bundle dnsmasq dropbear firewall4 fstools kmod-ath9k kmod-gpio-button-hotplug kmod-nft-offload libc libgcc libustream-mbedtls logd mtd netifd nftables odhcp6c odhcpd-ipv6only opkg ppp ppp-mod-pppoe procd-ujail swconfig uboot-envtools uci uclient-fetch urandom-seed urngd wpad-basic-mbedtls kmod-usb2 kmod-usb-ledtrig-usbport luci-app-attendedsysupgrade -kmod-ppp -ppp -ppp-mod-pppoe -wpad-mini wpad-mesh-mbedtls -wpad-basic-mbedtls -wpad-basic-wolfssl -firewall -firewall4 -wpad-basic kmod-ipt-nat kmod-ipt-conntrack iptables-mod-ipopt rpcd-mod-iwinfo rpcd iw tc uhttpd uhttpd-mod-ubus libiwinfo-lua olsrd olsrd-mod-arprefresh olsrd-mod-jsoninfo olsrd-mod-txtinfo olsrd-mod-nameservice olsrd-mod-watchdog olsrd-mod-dyn-gw weimarnetz-fastd-config fastd kmod-l2tp-eth resolveip weimarnetz-ffwizard -luci-app-weimarnetz weimarnetz-owm-exporter weimarnetz-button-config kmod-sched-cake prometheus-node-exporter-ucode prometheus-node-exporter-ucode-wifi prometheus-node-exporter-ucode-openwrt prometheus-node-exporter-ucode-dnsmasq prometheus-node-exporter-ucode-netstat weimarnetz-metrics-exporter weimarnetz-banner weimarnetz-feed-opkg weimarnetz-basic-website",
    },
    // { id: "standard", label: "Standard", packages: "..." },
    // { id: "expert", label: "Expert", packages: "..." },
  ],
};
