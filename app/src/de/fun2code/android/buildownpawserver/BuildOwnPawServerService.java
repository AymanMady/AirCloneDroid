package de.fun2code.android.buildownpawserver;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.util.Log;

import java.io.File;

import de.fun2code.android.pawserver.PawServerService;

/**
 * "Build your own PAW server" service, modernised for current Android:
 * it promotes itself to a foreground service with a notification channel so
 * the embedded web server keeps running while the app is in the background.
 */
public class BuildOwnPawServerService extends PawServerService {

    private static final String CHANNEL_ID = "paw_server";
    private static final int NOTIF_ID = 1;

    @Override
    public void onCreate() {
        super.onCreate();
        /*
         * Individual settings.
         */
        init();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Promote to a foreground service first, so a service started via
        // startForegroundService() satisfies the 5-second startForeground rule.
        startAsForeground();
        return super.onStartCommand(intent, flags, startId);
    }

    /*
     * Service options are:
     * TAG = Tag name for message logging.
     * startOnBoot = Indicates if service has been started on boot.
     * isRuntime = If set to true this will  only allow local connections.
     * serverConfig = Path to server configuration directory.
     * pawHome = PAW installation directory.
     * useWakeLock = Switch wakelock on or off.
     * hideNotificationIcon = Set to true if no notifications should be shown.
     * execAutostartScripts = Set to true if scripts inside the autostart directory should be executed onstartup.
     * showUrlInNotification = Set to true if URL should be shown in notification.
     * notificationTitle = The notification title.
     * notificationMessage = The notification message.
     * appName = Application name"
     * activityClass = Activity class name.
     * notificationDrawableId = ID of the notification icon to display.
     */
    private void init() {
        TAG = getString(R.string.app_name);
        startedOnBoot = false;
        isRuntime = false;

        // If the service is (re)started by the system without the activity,
        // INSTALL_DIR may not be set yet; derive it from internal storage.
        if (TabedActivity.INSTALL_DIR == null) {
            TabedActivity.INSTALL_DIR = new File(getFilesDir(), "www").getAbsolutePath();
        }

        serverConfig = TabedActivity.INSTALL_DIR + "/conf/server.xml";
        Log.d(TAG, serverConfig + " *************************************");
        pawHome = TabedActivity.INSTALL_DIR + "/";
        useWakeLock = true;
        // Let this subclass own the (modern) notification; the built-in PAW
        // notification uses Notification.setLatestEventInfo, removed in API 23.
        hideNotificationIcon = true;
        execAutostartScripts = false;
        showUrlInNotification = false;
        notificationTitle = "MyRemoteDroid";
        notificationMessage = "Serveur web actif";
        appName = getString(R.string.app_name);
        activityClass = "de.fun2code.android.buildownpawserver.TabedActivity";
        notificationDrawableId = R.drawable.app_icon;
    }

    /** Builds a notification channel (API 26+) and enters the foreground. */
    private void startAsForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm =
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID, "Serveur MyRemoteDroid",
                        NotificationManager.IMPORTANCE_LOW);
                channel.setDescription("Indique que le serveur web est en cours d'exécution");
                nm.createNotificationChannel(channel);
            }
        }

        Intent openApp = new Intent(this, TabedActivity.class);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentIntent =
                PendingIntent.getActivity(this, 0, openApp, piFlags);

        Notification notif;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notif = new Notification.Builder(this, CHANNEL_ID)
                    .setContentTitle("MyRemoteDroid")
                    .setContentText("Serveur web actif — accessible depuis votre PC")
                    .setSmallIcon(R.drawable.app_icon)
                    .setContentIntent(contentIntent)
                    .setOngoing(true)
                    .build();
        } else {
            notif = new Notification.Builder(this)
                    .setContentTitle("MyRemoteDroid")
                    .setContentText("Serveur web actif — accessible depuis votre PC")
                    .setSmallIcon(R.drawable.app_icon)
                    .setContentIntent(contentIntent)
                    .setOngoing(true)
                    .build();
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(NOTIF_ID, notif,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTIF_ID, notif);
            }
        } catch (Exception e) {
            Log.e(TAG, "startForeground failed", e);
        }
    }
}
