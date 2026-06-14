package com.deize.vrcnexus.quest;

import android.content.Intent;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// In-app updater: downloads a new APK and fires the system install prompt. The user taps
// "Update" (Android requires consent — silent install isn't allowed for sideloaded apps).
// The update APK MUST be signed with the same keystore as the installed app.
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        final String url = call.getString("url", "");
        if (url == null || url.isEmpty()) { call.reject("no url provided"); return; }
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                File outDir = new File(getContext().getCacheDir(), "updates");
                if (!outDir.exists()) outDir.mkdirs();
                File apk = new File(outDir, "update.apk");
                if (apk.exists()) apk.delete();

                conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setConnectTimeout(20000);
                conn.setReadTimeout(120000);
                conn.connect();
                int code = conn.getResponseCode();
                if (code / 100 != 2) { call.reject("download failed: HTTP " + code); return; }

                InputStream in = conn.getInputStream();
                FileOutputStream out = new FileOutputStream(apk);
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                out.flush(); out.close(); in.close();

                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "update failed" : e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
    }
}
