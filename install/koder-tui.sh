#!/usr/bin/env bash
set -euo pipefail
VERSION=0.3.1
BASE="${KODER_TUI_DOWNLOAD_BASE:-https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.1}"
INSTALL_ROOT="${KODER_TUI_HOME:-$HOME/.koder-tui}"
BIN_DIR="${KODER_TUI_BIN_DIR:-$HOME/.local/bin}"
case "${1:-}" in --help|-h) echo 'Install Koder TUI 0.3.1 for macOS. KODER_TUI_HOME and KODER_TUI_BIN_DIR customize installation.'; exit 0;; esac
[[ "$(uname -s)" == Darwin ]] || { echo 'This installer requires macOS.' >&2; exit 1; }
case "$(uname -m)" in arm64) ARCH=arm64;; x86_64) ARCH=x64;; *) echo 'Unsupported architecture' >&2; exit 1;; esac
if [[ "${KODER_TUI_EULA_ACCEPT:-}" != 1 ]]; then
  echo "Koder TUI is free for personal, noncommercial use under Koder-EULA-1.1."
  echo "Read https://github.com/KarmenLoop/koder-tui/blob/main/EULA.md"
  echo "Commercial use requires separate permission. Installation does not authorize tools or accounts."
  read -r -p 'Type accept to install, or Enter to cancel: ' answer </dev/tty
  [[ "$answer" == accept ]] || exit 1
fi
FILE="koder-tui-$VERSION-macos-$ARCH.tar.gz"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fL --retry 2 --connect-timeout 20 --max-time 600 "$BASE/$FILE" -o "$TMP/$FILE"
curl -fsSL --retry 2 --max-time 60 "$BASE/SHA256SUMS" -o "$TMP/SHA256SUMS"
EXPECTED="$(awk -v f="$FILE" '$2==f {print $1}' "$TMP/SHA256SUMS")"
[[ "$EXPECTED" =~ ^[0-9a-f]{64}$ ]] || { echo 'Missing checksum' >&2; exit 1; }
ACTUAL="$(shasum -a 256 "$TMP/$FILE" | awk '{print $1}')"
[[ "$ACTUAL" == "$EXPECTED" ]] || { echo 'Checksum mismatch' >&2; exit 1; }
tar -xzf "$TMP/$FILE" -C "$TMP"
"$TMP/koder-tui/runtime/bin/node" "$TMP/koder-tui/packages/koder-tui/bin/koder-tui.mjs" --version
mkdir -p "$INSTALL_ROOT/versions" "$BIN_DIR"
# Each install has its own directory. Only the command link is replaced.
DEST="$(mktemp -d "$INSTALL_ROOT/versions/$VERSION.XXXXXX")"
cp -R "$TMP/koder-tui/." "$DEST/"
LAUNCHER="$BIN_DIR/koder-tui"
if [[ -e "$LAUNCHER" && ! -L "$LAUNCHER" ]]; then echo "Refusing to replace existing file: $LAUNCHER" >&2; exit 1; fi
ln -s "$DEST/koder-tui.command" "$BIN_DIR/.koder-tui-$$"
mv -f "$BIN_DIR/.koder-tui-$$" "$LAUNCHER"
echo "Installed: $LAUNCHER"
echo "Run: $LAUNCHER"
echo "If needed, add $BIN_DIR to PATH. Your existing CLI and saved configuration are unchanged."
