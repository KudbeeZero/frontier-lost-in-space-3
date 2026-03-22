# Frontier — Static Game Assets

Place the following files here to activate the nebula + music enhancements.
Both features degrade gracefully when the files are absent — the CSS fallback
still renders and the game boots normally.

---

## nebula.hdr  — Nebula HDRI skybox

**Required path:** `frontend/public/assets/nebula.hdr`

Free HDR downloads (no attribution required):

| Source | URL | Notes |
|--------|-----|-------|
| Poly Haven | https://polyhaven.com/hdris | Search "space" or "galaxy" — download 2K .hdr |
| HDRI Haven mirror | https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/ | Direct download list |
| Sketchfab free skybox | https://sketchfab.com/3d-models/free-skybox-space-nebula-fa5c19c4f7cc4525a24b99425bd520c8 | Convert to .hdr if needed |

Recommended: **"Starfield" or "Kloppenheim" from Poly Haven** (2K, ~8 MB).

Rename the downloaded file to `nebula.hdr` and place it in this directory.

---

## audio/space-ambient.mp3  — Loopable ambient track

**Required path:** `frontend/public/assets/audio/space-ambient.mp3`

Free tracks (no attribution required):

| Source | URL | Search term |
|--------|-----|-------------|
| Pixabay | https://pixabay.com/music/search/space%20ambient/ | "space ambient", "deep space" |
| Mixkit | https://mixkit.co/free-stock-music/sci-fi/ | Sci-fi ambient |
| Uppbeat | https://uppbeat.io/browse/music/space | Space / ambient |

Look for a track ≥ 2 min with a seamless loop point, volume around -12 dB LUFS.
Rename to `space-ambient.mp3` and place in `audio/`.

---

Both assets are listed in `.gitignore` for large-binary hygiene — add explicit
`!public/assets/nebula.hdr` entries to your gitignore if you want to commit them.
