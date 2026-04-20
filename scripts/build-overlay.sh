#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPSTREAM_DIR="${ROOT_DIR}/../firmware-selector-openwrt-org"
OUTPUT_DIR="${ROOT_DIR}/dist"
TMP_DIR="${ROOT_DIR}/tmp/build"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --upstream-dir)
      UPSTREAM_DIR="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unbekannter Parameter: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "${UPSTREAM_DIR}/www" ]]; then
  echo "Upstream-Verzeichnis fehlt oder enthält kein www/: ${UPSTREAM_DIR}" >&2
  exit 1
fi

rm -rf "${TMP_DIR}"
mkdir -p "${TMP_DIR}" "${OUTPUT_DIR}"

cp -R "${UPSTREAM_DIR}/www" "${TMP_DIR}/www"
cp -R "${ROOT_DIR}/overlay/www/." "${TMP_DIR}/www/"

rm -rf "${OUTPUT_DIR}/www"
cp -R "${TMP_DIR}/www" "${OUTPUT_DIR}/www"

tar -C "${TMP_DIR}/www" -czf "${OUTPUT_DIR}/www.tar.gz" .

if command -v sha256sum >/dev/null 2>&1; then
  (cd "${OUTPUT_DIR}" && sha256sum "www.tar.gz" > "www.tar.gz.sha256")
else
  (cd "${OUTPUT_DIR}" && shasum -a 256 "www.tar.gz" > "www.tar.gz.sha256")
fi

echo "Build abgeschlossen:"
echo "  - ${OUTPUT_DIR}/www"
echo "  - ${OUTPUT_DIR}/www.tar.gz"
echo "  - ${OUTPUT_DIR}/www.tar.gz.sha256"
