# Changelog

## 1.1.0 - 2026-08-08
- Simplified the control to one source folder and one destination folder.
- Added configurable `SourceFolderName`, `DestinationFolderName` and `FileName` properties.
- Added configurable `AnimationTime` property.
- Added Boolean `Start` / `End` handshake.
- `Start = TRUE` starts one transfer.
- `End = TRUE` is generated when the file reaches destination.
- The file remains visible at destination after successful completion.
- When WinCC resets `Start = FALSE`, the CWC resets `End = FALSE` and returns the file to source.
- Migrated the project structure to the WebCC template pattern (`webcc.min.js`, `webccInterface.js`, `codeAnimated.js`).
- Removed legacy multi-folder methods/events and standardized all naming to Animated.
