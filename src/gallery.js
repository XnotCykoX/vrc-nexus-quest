// Screenshot gallery — lists image files from a folder on the Quest and exposes
// webview-displayable URLs. VRChat's screenshot location varies, so the folder is
// configurable; we default to the common Pictures/VRChat path.
import { Filesystem, Directory } from "@capacitor/filesystem";

function isNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

const IMG = /\.(png|jpe?g|webp)$/i;

export async function listScreenshots(subPath = "Pictures/VRChat") {
  if (!isNative()) return { ok: false, error: "The gallery works on the Quest only.", images: [] };
  try { await Filesystem.requestPermissions(); } catch { /* best effort */ }
  try {
    const res = await Filesystem.readdir({ path: subPath, directory: Directory.ExternalStorage });
    const entries = (res.files || []).filter((f) => IMG.test(f.name || f));
    const images = [];
    for (const f of entries) {
      const name = f.name || f;
      let uri = f.uri;
      if (!uri) {
        const g = await Filesystem.getUri({ path: `${subPath}/${name}`, directory: Directory.ExternalStorage });
        uri = g.uri;
      }
      images.push({ name, mtime: f.mtime || 0, src: window.Capacitor.convertFileSrc(uri) });
    }
    images.sort((a, b) => (b.mtime || 0) - (a.mtime || 0) || (a.name < b.name ? 1 : -1));
    return { ok: true, images };
  } catch (e) {
    return { ok: false, error: e.message || String(e), images: [] };
  }
}
