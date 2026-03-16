# App Icons

Place platform-specific icons here before building a release:

| File | Platform | Size |
|------|----------|------|
| `icon.icns` | macOS | 512×512 (icns bundle) |
| `icon.ico` | Windows | 256×256 (multi-res ico) |
| `icon.png` | Linux | 512×512 PNG |

`icon.svg` is the source — convert with `rsvg-convert`, Inkscape, or an online tool.
electron-builder will auto-discover icons by name convention.
