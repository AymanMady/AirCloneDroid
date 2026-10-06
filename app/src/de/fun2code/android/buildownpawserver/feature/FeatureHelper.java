package de.fun2code.android.buildownpawserver.feature;

import android.app.WallpaperManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaRecorder;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.util.Log;

import java.io.File;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Helpers for the "nice to have" features, called from thin BeanShell
 * endpoints. Every method returns a small JSON string and never throws, so a
 * failing feature degrades gracefully instead of taking the server down.
 */
public class FeatureHelper {

    private static final String TAG = "FeatureHelper";

    // ----------------------------------------------------------------- TTS
    private static TextToSpeech tts;
    private static volatile boolean ttsReady = false;

    /** Speaks the given text through the phone's speaker (French voice). */
    public static synchronized String speak(Context ctx, String text) {
        if (text == null || text.trim().length() == 0) {
            return err("Texte vide");
        }
        try {
            if (tts == null) {
                final CountDownLatch latch = new CountDownLatch(1);
                tts = new TextToSpeech(ctx.getApplicationContext(),
                        new TextToSpeech.OnInitListener() {
                            @Override
                            public void onInit(int status) {
                                ttsReady = (status == TextToSpeech.SUCCESS);
                                if (ttsReady) {
                                    tts.setLanguage(Locale.FRENCH);
                                }
                                latch.countDown();
                            }
                        });
                latch.await(5, TimeUnit.SECONDS);
            }
            if (!ttsReady) {
                return err("Moteur de synthèse vocale indisponible");
            }
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "mrd-tts");
            return "{\"success\":true}";
        } catch (Exception e) {
            Log.e(TAG, "speak failed", e);
            return err(e.getMessage());
        }
    }

    // ----------------------------------------------------------- WALLPAPER
    /** Sets the device wallpaper from an image file already on the phone. */
    public static String setWallpaper(Context ctx, String path) {
        try {
            if (path == null) return err("Chemin manquant");
            File f = new File(path);
            if (!f.exists()) return err("Fichier introuvable : " + path);
            Bitmap bmp = BitmapFactory.decodeFile(path);
            if (bmp == null) return err("Image illisible");
            WallpaperManager.getInstance(ctx.getApplicationContext()).setBitmap(bmp);
            return "{\"success\":true}";
        } catch (Exception e) {
            Log.e(TAG, "setWallpaper failed", e);
            return err(e.getMessage());
        }
    }

    // --------------------------------------------------------- MICROPHONE
    private static MediaRecorder recorder;
    private static String currentRecUrl;

    /** Starts recording from the microphone to a downloadable .m4a file. */
    public static synchronized String startRecording(Context ctx) {
        try {
            if (recorder != null) return err("Un enregistrement est déjà en cours");
            File dir = new File(ctx.getFilesDir(), "www/html/public/recordings");
            dir.mkdirs();
            String name = "rec_" + System.currentTimeMillis() + ".m4a";
            File out = new File(dir, name);

            MediaRecorder r = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                    ? new MediaRecorder(ctx) : new MediaRecorder();
            r.setAudioSource(MediaRecorder.AudioSource.MIC);
            r.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            r.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            r.setOutputFile(out.getAbsolutePath());
            r.prepare();
            r.start();

            recorder = r;
            currentRecUrl = "public/recordings/" + name;
            return "{\"success\":true}";
        } catch (Exception e) {
            Log.e(TAG, "startRecording failed", e);
            recorder = null;
            return err(e.getMessage());
        }
    }

    /** Stops the current recording and returns the downloadable file URL. */
    public static synchronized String stopRecording() {
        try {
            if (recorder == null) return err("Aucun enregistrement en cours");
            try {
                recorder.stop();
            } finally {
                recorder.release();
                recorder = null;
            }
            String url = currentRecUrl;
            currentRecUrl = null;
            return "{\"success\":true,\"file\":\"" + url + "\"}";
        } catch (Exception e) {
            Log.e(TAG, "stopRecording failed", e);
            recorder = null;
            return err(e.getMessage());
        }
    }

    public static boolean isRecording() {
        return recorder != null;
    }

    // -------------------------------------------------------------- utils
    static String err(String msg) {
        return "{\"success\":false,\"error\":\"" + esc(msg) + "\"}";
    }

    static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", " ").replace("\r", " ");
    }
}
