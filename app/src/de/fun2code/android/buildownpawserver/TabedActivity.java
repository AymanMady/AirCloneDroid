package de.fun2code.android.buildownpawserver;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.ActionBar;
import android.app.ActionBar.TabListener;
import android.app.Fragment;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.provider.Settings;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import de.fun2code.android.buildownpawserver.tab.ChangePassword;
import de.fun2code.android.buildownpawserver.tab.Connexion;
import de.fun2code.android.buildownpawserver.tab.MyTabListener;
import de.fun2code.android.pawserver.PawServerActivity;
import de.fun2code.android.pawserver.PawServerService;
import de.fun2code.android.pawserver.listener.ServiceListener;
import de.fun2code.android.pawserver.util.Utils;

import java.io.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;


@SuppressLint("NewApi")
public class TabedActivity extends PawServerActivity implements ServiceListener {

    @SuppressWarnings("unused")
    private Handler handler;

    // View that displays the server URL
    private TextView viewUrl;

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

    ActionBar.Tab tab1, tab2;
    Fragment fragmentTab1 = new Connexion();
    Fragment fragmentTab2 = new ChangePassword();

    /** Set to true once the web content has been copied to INSTALL_DIR. */
    public static volatile boolean assetsReady = false;

    private static final int REQ_PERMISSIONS = 101;

    @SuppressLint({"InlinedApi", "NewApi"})
    @Override
    public void onCreate(Bundle savedInstanceState) {
        TAG = "BuildOwnPawServer";

        /*
         * Web content now lives in the app's private internal storage instead
         * of /sdcard/www. This works on every modern Android version without
         * storage permissions and is not affected by scoped storage.
         */
        INSTALL_DIR = new File(getFilesDir(), "www").getAbsolutePath();

        /*
         * Turn the PawServerActivity into runtime mode.
		 * Otherwise an error may occur if some things special to the
		 * original PAW server are not available.
		 */
        calledFromRuntime = true;

        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_ACTION_BAR);
//        setContentView(R.layout.activity_tabed);
        handler = new Handler();

        // URL TextView
        viewUrl = (TextView) findViewById(R.id.server_state);

        requestRuntimePermissions();
        installAssetsAsync();

        /*
         * Register handler This is needed in order to get dialogs etc. to work.
		 */
        messageHandler = new MessageHandler(this);
        BuildOwnPawServerService.setActivityHandler(messageHandler);

		/*
         * Register activity with service.
		 */

        setContentView(R.layout.activity_tabed);

        ActionBar actionBar = getActionBar();
        actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_TABS);

        tab1 = actionBar.newTab().setText("Connexion");
        tab2 = actionBar.newTab().setText("Change Password");

        tab1.setTabListener((TabListener) new MyTabListener(fragmentTab1));
        tab2.setTabListener((TabListener) new MyTabListener(fragmentTab2));

        actionBar.addTab(tab1);
        actionBar.addTab(tab2);
        BuildOwnPawServerService.setActivity(this);

    }

    public void addListenerOnButton() {

        Button buttonGo = (Button) findViewById(R.id.runButton);

        buttonGo.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View arg0) {
                runOrStopServer();
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        /*
		 *  Registers the listener that calls onServiceStart() and
		 *  onServiceStop().
		 */
        BuildOwnPawServerService.registerServiceListener(this);
        startService();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopService();

		/*
		 * Unregisters the listener
		 */
        BuildOwnPawServerService.unregisterServiceListener(this);

    }

    /**
     * Stops the service
     */
    @Override
    public void stopService() {
        Intent serviceIntent = new Intent(this.getApplicationContext(),
                BuildOwnPawServerService.class);
        stopService(serviceIntent);
    }

    /**
     * Starts the service
     */
    @Override
    public void startService() {
    }

    public void runOrStopServer() {

        Button btn = (Button) findViewById(R.id.runButton);

        if (BuildOwnPawServerService.isRunning()) {
            stopService();
            btn.setBackgroundResource(R.drawable.start_button);
            viewUrl = (TextView) findViewById(R.id.server_state);
            viewUrl.setText("Server is stopped");
        } else {
            if (!assetsReady) {
                Toast.makeText(this, "Préparation des fichiers web, patientez…",
                        Toast.LENGTH_SHORT).show();
                return;
            }
            Intent serviceIntent = new Intent(TabedActivity.this,
                    BuildOwnPawServerService.class);

            // On Android O+ a foreground service must be started as such.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            btn.setBackgroundResource(R.drawable.stop_button);
        }
    }

    /**
     * Called when the service has been started
     *
     * @param success <code>true</code> if service was started successfully,
     *                otherwise <code>false</code>
     */
    @Override
    public void onServiceStart(boolean success) {
        viewUrl = (TextView) findViewById(R.id.server_state);


        if (success) {
            // Display URL
            PawServerService service = BuildOwnPawServerService.getService();
            final String url = service.getPawServer().server.protocol
                    + "://" + Utils.getLocalIpAddress() + ":"
                    + service.getPawServer().serverPort;

            if (Utils.getLocalIpAddress() != null) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        String pin = currentPin == null ? "…" : currentPin;
                        viewUrl.setText(url + "\nCode de connexion : " + pin);
                    }
                });
            } else {
                viewUrl.setText("Pas de connexion Wi-Fi");
            }

        } else {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    viewUrl.setText("Server could not be started!");
                }
            });
        }

    }

    /**
     * Called when the service has been stopped
     *
     * @param success <code>true</code> if service was started successfully,
     *                otherwise <code>false</code>
     */
    @Override
    public void onServiceStop(boolean success) {

    }

    /**
     * Checks the installation and extracts the content.zip file
     * to INSTALL_DIR if needed
     */
    private void checkInstallation() {
        if (!new File(INSTALL_DIR).exists()) {
            // Create directories
            new File(INSTALL_DIR).mkdirs();

            // Files not to overwrite
            HashMap<String, Integer> keepFiles = new HashMap<String, Integer>();

            // Extract ZIP file form assets
            try {
                extractZip(getAssets().open("content.zip"),
                        INSTALL_DIR, keepFiles);
            } catch (IOException e) {
                Log.e(TAG, e.getMessage());
            }

        }
    }


    /**
     * Top-level asset folders that make up the web application. Listing the
     * asset root ("") is avoided on purpose: on some devices it also returns
     * framework asset folders (webkit, images, …) which polluted the install.
     */
    private static final String[] WEB_ASSET_DIRS = {"conf", "html", "logs", "tmp"};

    /** Bumped whenever the bundled web content changes, to force a re-copy. */
    private static final String INSTALL_MARKER = ".installed_v8";

    /** Connection PIN shown to the user; required to log into the web UI. */
    public static volatile String currentPin = null;

    /**
     * Copies the bundled web application to INSTALL_DIR on a background thread.
     * Already-installed content is detected via a marker file and skipped, so
     * startup is instant after the first launch and never blocks the UI thread.
     */
    private void installAssetsAsync() {
        final File installDir = new File(INSTALL_DIR);
        final File marker = new File(installDir, INSTALL_MARKER);
        if (marker.exists()) {
            ensurePassword();
            assetsReady = true;
            return;
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                installDir.mkdirs();
                for (String dir : WEB_ASSET_DIRS) {
                    copyFileOrDir(dir);
                }
                ensurePassword();
                try {
                    new FileOutputStream(marker).close();
                } catch (IOException ignored) {
                }
                assetsReady = true;
                Log.i(TAG, "Web assets installed to " + INSTALL_DIR);
            }
        }, "asset-copy").start();
    }

    /**
     * Makes sure a connection PIN exists. The PIN is stored in conf/password
     * (outside the web root, so it is never served) and read by the BeanShell
     * auth guard. A fresh random 4-digit PIN is generated on first run.
     */
    private void ensurePassword() {
        try {
            File confDir = new File(INSTALL_DIR, "conf");
            confDir.mkdirs();
            File pwFile = new File(confDir, "password");
            if (!pwFile.exists()) {
                String pin = String.format(java.util.Locale.US, "%04d",
                        new java.security.SecureRandom().nextInt(10000));
                FileOutputStream fos = new FileOutputStream(pwFile);
                fos.write(pin.getBytes("UTF-8"));
                fos.close();
            }
            BufferedReader br = new BufferedReader(new FileReader(pwFile));
            currentPin = br.readLine();
            br.close();
        } catch (Exception e) {
            Log.e(TAG, "ensurePassword failed", e);
        }
    }

    private void copyFileOrDir(String path) {
        AssetManager assetManager = this.getAssets();
        String assets[];
        try {
            assets = assetManager.list(path);
            if (assets == null || assets.length == 0) {
                copyFile(path);
            } else {
                File dir = new File(INSTALL_DIR + "/" + path);
                if (!dir.exists() && !dir.mkdirs()) {
                    Log.w(TAG, "could not create dir " + dir);
                }
                for (String asset : assets) {
                    String p = path.equals("") ? "" : path + "/";
                    copyFileOrDir(p + asset);
                }
            }
        } catch (IOException ex) {
            Log.e(TAG, "I/O Exception listing " + path, ex);
        }
    }

    private void copyFile(String filename) {
        AssetManager assetManager = this.getAssets();
        InputStream in = null;
        OutputStream out = null;
        String newFileName = null;
        try {
            in = assetManager.open(filename);
            if (filename.endsWith(".jpg")) // extension added to avoid APK compression
                newFileName = INSTALL_DIR + "/" + filename.substring(0, filename.length() - 4);
            else
                newFileName = INSTALL_DIR + "/" + filename;
            out = new FileOutputStream(newFileName);

            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception in copyFile() of " + newFileName + ": " + e);
        } finally {
            try { if (in != null) in.close(); } catch (IOException ignored) {}
            try { if (out != null) out.close(); } catch (IOException ignored) {}
        }
    }

    // ---------------------------------------------------------------------
    // Runtime permissions (Android 6+) + all-files access (Android 11+)
    // ---------------------------------------------------------------------

    private void requestRuntimePermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }
        List<String> wanted = new ArrayList<String>(Arrays.asList(
                Manifest.permission.READ_CONTACTS,
                Manifest.permission.WRITE_CONTACTS,
                Manifest.permission.READ_SMS,
                Manifest.permission.SEND_SMS,
                Manifest.permission.READ_CALL_LOG,
                Manifest.permission.WRITE_CALL_LOG,
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            wanted.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
            wanted.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            wanted.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        List<String> toAsk = new ArrayList<String>();
        for (String p : wanted) {
            if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) {
                toAsk.add(p);
            }
        }
        if (!toAsk.isEmpty()) {
            requestPermissions(toAsk.toArray(new String[0]), REQ_PERMISSIONS);
        }
        requestAllFilesAccessIfNeeded();
    }

    /**
     * The file-manager feature browses the whole shared storage, which on
     * Android 11+ requires the special "All files access" grant.
     */
    @SuppressLint("NewApi")
    private void requestAllFilesAccessIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                && !Environment.isExternalStorageManager()) {
            try {
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            } catch (Exception e) {
                Log.w(TAG, "Could not open all-files-access settings", e);
            }
        }
    }

}