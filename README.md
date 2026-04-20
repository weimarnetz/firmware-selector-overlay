# Firmware Selector Custom Overlay

This repository builds a static `www` artifact for the OpenWrt Firmware Selector.
The upstream source remains unchanged and is pinned to a specific commit via `upstream.lock.yml`.

## Structure

- `overlay/www/`: custom files that are overlaid onto the upstream `www/`
- `scripts/build-overlay.sh`: reproducibly builds `www.tar.gz` and `www.tar.gz.sha256`
- `tests/js/`: unit and integration tests for custom helper functions and upstream compatibility

## Build

Requirements:
- `git`
- `tar`
- `sha256sum` or `shasum`
- `node` (only for tests)

Example:

```bash
./scripts/build-overlay.sh \
  --upstream-dir ../firmware-selector-openwrt-org \
  --output-dir dist
```

Output:
- `dist/www/` (final directory)
- `dist/www.tar.gz`
- `dist/www.tar.gz.sha256`

## Tests

```bash
UPSTREAM_DIR=../firmware-selector-openwrt-org node --test tests/js/*.test.js
```

## Release Process

1. Update the upstream commit in `upstream.lock.yml`.
2. Run build and tests locally/in CI.
3. Publish `www.tar.gz` and checksum as release artifacts.
4. Roll out deployment via `weimarnetz/playbooks`.
