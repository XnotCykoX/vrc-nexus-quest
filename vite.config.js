import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// In the browser (dev) the VRChat + avatar-DB APIs block cross-origin requests, so we
// proxy them here. On the Quest the app runs inside Capacitor and uses the native HTTP
// layer instead (no CORS), so these proxies are dev-only.
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    proxy: {
      "/vrcapi": {
        target: "https://api.vrchat.cloud",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/vrcapi/, "/api/1"),
        cookieDomainRewrite: "",
      },
      "/prismic": {
        target: "https://avtr.icu",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/prismic/, ""),
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VRCNexus/1.2.17 deize@users.noreply.github.com" },
      },
      "/prismic2": {
        target: "https://avtr.zuxi.dev",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/prismic2/, ""),
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VRCNexus/1.2.17 deize@users.noreply.github.com" },
      },
    },
  },
  build: { outDir: "dist", target: "es2020" },
});
