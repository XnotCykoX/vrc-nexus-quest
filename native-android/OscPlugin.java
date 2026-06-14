package com.deize.vrcnexus.quest;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// Minimal UDP socket bridge so the web layer can send/receive OSC to standalone VRChat
// (which listens on 127.0.0.1:9000 and sends on 9001). The web side does all OSC
// encoding/decoding; this just moves bytes.
@CapacitorPlugin(name = "Osc")
public class OscPlugin extends Plugin {

    private DatagramSocket sendSocket;
    private DatagramSocket recvSocket;
    private Thread recvThread;
    private volatile boolean listening = false;
    // Network I/O cannot run on the UI thread (NetworkOnMainThreadException). Capacitor
    // plugin methods run on the main thread, so all sends go through this background executor.
    private final ExecutorService sendPool = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void send(PluginCall call) {
        final String host = call.getString("host", "127.0.0.1");
        final int port = call.getInt("port", 9000);
        final String dataB64 = call.getString("data", "");
        sendPool.execute(() -> {
            try {
                byte[] bytes = Base64.decode(dataB64, Base64.DEFAULT);
                if (sendSocket == null || sendSocket.isClosed()) sendSocket = new DatagramSocket();
                InetAddress addr = InetAddress.getByName(host);
                DatagramPacket pkt = new DatagramPacket(bytes, bytes.length, addr, port);
                sendSocket.send(pkt);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "send failed" : e.getMessage());
            }
        });
    }

    @PluginMethod
    public void startListen(PluginCall call) {
        final int port = call.getInt("port", 9001);
        stopInternal();
        listening = true;
        recvThread = new Thread(() -> {
            try {
                recvSocket = new DatagramSocket(null);
                recvSocket.setReuseAddress(true);
                recvSocket.bind(new java.net.InetSocketAddress(port));
                byte[] buf = new byte[8192];
                while (listening) {
                    DatagramPacket p = new DatagramPacket(buf, buf.length);
                    recvSocket.receive(p);
                    String b64 = Base64.encodeToString(p.getData(), 0, p.getLength(), Base64.NO_WRAP);
                    JSObject ev = new JSObject();
                    ev.put("data", b64);
                    notifyListeners("osc", ev);
                }
            } catch (Exception ignored) {
                // socket closed on stop
            }
        });
        recvThread.start();
        call.resolve();
    }

    @PluginMethod
    public void stopListen(PluginCall call) {
        stopInternal();
        call.resolve();
    }

    private void stopInternal() {
        listening = false;
        if (recvSocket != null) {
            try { recvSocket.close(); } catch (Exception ignored) {}
            recvSocket = null;
        }
        recvThread = null;
    }

    @Override
    protected void handleOnDestroy() {
        stopInternal();
        if (sendSocket != null) { try { sendSocket.close(); } catch (Exception ignored) {} }
        try { sendPool.shutdownNow(); } catch (Exception ignored) {}
        super.handleOnDestroy();
    }
}
