package de.fun2code.android.buildownpawserver.feature;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.util.Log;

/**
 * Reliable device status (battery / memory / Wi-Fi) for the dashboard.
 *
 * Unlike the legacy status_bar.xhtml — which registers a live battery receiver
 * and can block indefinitely — this reads the *sticky* battery intent
 * (registerReceiver(null, …) returns immediately) and guards every section in
 * its own try/catch, so the call always returns promptly and never throws.
 *
 * Returns a single JSON object:
 *   {"battery":{"percent":100,"charging":true},
 *    "memory":{"available":"732M"},
 *    "wifi":{"name":"...","strength":70,"linkspeed":"65 Mbps"}}
 */
public class StatusHelper {

    private static final String TAG = "StatusHelper";

    public static String status(Context ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"battery\":").append(battery(ctx)).append(",");
        sb.append("\"memory\":").append(memory(ctx)).append(",");
        sb.append("\"wifi\":").append(wifi(ctx));
        sb.append("}");
        return sb.toString();
    }

    private static String battery(Context ctx) {
        try {
            IntentFilter f = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent i = ctx.getApplicationContext().registerReceiver(null, f);
            if (i == null) return "null";
            int level = i.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = i.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            int status = i.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            int percent = (level >= 0 && scale > 0) ? (level * 100 / scale) : 0;
            boolean charging = status == BatteryManager.BATTERY_STATUS_CHARGING
                    || status == BatteryManager.BATTERY_STATUS_FULL;
            return "{\"percent\":" + percent + ",\"charging\":" + charging + "}";
        } catch (Exception e) {
            Log.e(TAG, "battery failed", e);
            return "null";
        }
    }

    private static String memory(Context ctx) {
        try {
            ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(mi);
            long availMb = mi.availMem / 1024 / 1024;
            return "{\"available\":\"" + availMb + "M\"}";
        } catch (Exception e) {
            Log.e(TAG, "memory failed", e);
            return "null";
        }
    }

    private static String wifi(Context ctx) {
        try {
            WifiManager wm = (WifiManager) ctx.getApplicationContext()
                    .getSystemService(Context.WIFI_SERVICE);
            if (wm == null) return "null";
            WifiInfo info = wm.getConnectionInfo();
            if (info == null) return "null";

            String ssid = info.getSSID();
            if (ssid == null) ssid = "";
            ssid = ssid.replace("\"", "");

            int rssi = info.getRssi();
            int strength = 100 + rssi + 20; // same heuristic as the legacy UI
            if (strength > 100) strength = 100;
            if (strength < 0) strength = 0;

            int link = info.getLinkSpeed();
            String linkspeed = (link < 0) ? "" : (link + " Mbps");

            return "{\"name\":\"" + FeatureHelper.esc(ssid) + "\",\"strength\":" + strength
                    + ",\"linkspeed\":\"" + linkspeed + "\"}";
        } catch (Exception e) {
            Log.e(TAG, "wifi failed", e);
            return "null";
        }
    }
}
