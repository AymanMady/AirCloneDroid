package de.fun2code.android.buildownpawserver.feature;

import android.content.Context;
import android.os.Build;
import android.telephony.SmsManager;
import android.util.Log;

import java.util.ArrayList;

/**
 * Sends SMS directly through {@link SmsManager}.
 *
 * The PAW jar's SmsUtil.sendSms creates a PendingIntent without
 * FLAG_IMMUTABLE, which throws on Android 12+ (targetSdk 31+). Sending here
 * with null sent/delivery intents avoids creating any PendingIntent at all.
 */
public class SmsHelper {

    public static String send(Context ctx, String number, String message) {
        try {
            if (number == null || number.trim().length() == 0) {
                return FeatureHelper.err("Numéro manquant");
            }
            if (message == null) message = "";

            // The web layer may suffix the number with a "@DEL@name" marker.
            int d = number.indexOf("@DEL@");
            if (d >= 0) number = number.substring(0, d);
            number = number.trim();

            SmsManager sms = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                sms = ctx.getSystemService(SmsManager.class);
            }
            if (sms == null) {
                sms = SmsManager.getDefault();
            }

            ArrayList<String> parts = sms.divideMessage(message);
            if (parts.size() > 1) {
                sms.sendMultipartTextMessage(number, null, parts, null, null);
            } else {
                sms.sendTextMessage(number, null, message, null, null);
            }
            return "{\"success\":true}";
        } catch (Exception e) {
            Log.e("SmsHelper", "send failed", e);
            return FeatureHelper.err(e.getMessage());
        }
    }
}
