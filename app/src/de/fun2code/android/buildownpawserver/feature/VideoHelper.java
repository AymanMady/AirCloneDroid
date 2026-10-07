package de.fun2code.android.buildownpawserver.feature;

import android.content.Context;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;
import android.view.Surface;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Headless video recording (Camera2 + MediaRecorder, no on-screen preview),
 * driven by start/stop requests from the web UI. Returns a small JSON string
 * and never throws. Keeps state between the two calls in static fields.
 */
public class VideoHelper {

    private static final String TAG = "VideoHelper";

    private static CameraDevice camera;
    private static CameraCaptureSession session;
    private static MediaRecorder recorder;
    private static HandlerThread thread;
    private static String currentUrl;

    public static synchronized boolean isRecording() {
        return recorder != null;
    }

    public static synchronized String start(Context ctx, boolean front) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return FeatureHelper.err("Camera2 requiert Android 5+");
        }
        if (recorder != null) {
            return FeatureHelper.err("Un enregistrement vidéo est déjà en cours");
        }
        try {
            thread = new HandlerThread("mrd-video");
            thread.start();
            final Handler handler = new Handler(thread.getLooper());

            CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
            final String camId = pickCamera(cm, front);
            if (camId == null) return cleanupWithError("Aucune caméra disponible");

            File dir = new File(ctx.getFilesDir(), "www/html/public/videos");
            dir.mkdirs();
            String name = "video_" + System.currentTimeMillis() + ".mp4";
            File out = new File(dir, name);

            recorder = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                    ? new MediaRecorder(ctx) : new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setOutputFile(out.getAbsolutePath());
            recorder.setVideoEncodingBitRate(3_000_000);
            recorder.setVideoFrameRate(30);
            recorder.setVideoSize(1280, 720);
            recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.prepare();

            final Surface recorderSurface = recorder.getSurface();
            final CountDownLatch ready = new CountDownLatch(1);
            final boolean[] ok = {false};

            cm.openCamera(camId, new CameraDevice.StateCallback() {
                @Override
                public void onOpened(CameraDevice cam) {
                    camera = cam;
                    try {
                        List<Surface> surfaces = new ArrayList<Surface>();
                        surfaces.add(recorderSurface);
                        cam.createCaptureSession(surfaces, new CameraCaptureSession.StateCallback() {
                            @Override
                            public void onConfigured(CameraCaptureSession s) {
                                session = s;
                                try {
                                    CaptureRequest.Builder b =
                                            cam.createCaptureRequest(CameraDevice.TEMPLATE_RECORD);
                                    b.addTarget(recorderSurface);
                                    s.setRepeatingRequest(b.build(), null, handler);
                                    recorder.start();
                                    ok[0] = true;
                                } catch (Exception e) {
                                    Log.e(TAG, "start recording failed", e);
                                } finally {
                                    ready.countDown();
                                }
                            }

                            @Override
                            public void onConfigureFailed(CameraCaptureSession s) {
                                Log.e(TAG, "session configure failed");
                                ready.countDown();
                            }
                        }, handler);
                    } catch (Exception e) {
                        Log.e(TAG, "createCaptureSession failed", e);
                        ready.countDown();
                    }
                }

                @Override
                public void onDisconnected(CameraDevice cam) {
                    ready.countDown();
                }

                @Override
                public void onError(CameraDevice cam, int error) {
                    Log.e(TAG, "camera error " + error);
                    ready.countDown();
                }
            }, handler);

            ready.await(5, TimeUnit.SECONDS);
            if (!ok[0]) {
                return cleanupWithError("Impossible de démarrer l'enregistrement");
            }
            currentUrl = "public/videos/" + name;
            return "{\"success\":true}";
        } catch (Exception e) {
            Log.e(TAG, "start failed", e);
            return cleanupWithError(e.getMessage());
        }
    }

    public static synchronized String stop() {
        if (recorder == null) {
            return FeatureHelper.err("Aucun enregistrement vidéo en cours");
        }
        String url = currentUrl;
        boolean stopped = false;
        try {
            try {
                if (session != null) session.stopRepeating();
            } catch (Exception ignored) {
            }
            try {
                recorder.stop();
                stopped = true;
            } catch (Exception e) {
                Log.e(TAG, "recorder.stop failed (too short?)", e);
            }
        } finally {
            cleanup();
        }
        if (stopped) {
            return "{\"success\":true,\"file\":\"" + url + "\"}";
        }
        return FeatureHelper.err("Enregistrement trop court ou invalide");
    }

    private static String cleanupWithError(String msg) {
        cleanup();
        return FeatureHelper.err(msg);
    }

    private static void cleanup() {
        try { if (session != null) session.close(); } catch (Exception ignored) {}
        try { if (camera != null) camera.close(); } catch (Exception ignored) {}
        try { if (recorder != null) recorder.release(); } catch (Exception ignored) {}
        try { if (thread != null) thread.quitSafely(); } catch (Exception ignored) {}
        session = null;
        camera = null;
        recorder = null;
        thread = null;
        currentUrl = null;
    }

    private static String pickCamera(CameraManager cm, boolean front) throws Exception {
        String fallback = null;
        int wanted = front ? CameraCharacteristics.LENS_FACING_FRONT
                : CameraCharacteristics.LENS_FACING_BACK;
        for (String id : cm.getCameraIdList()) {
            if (fallback == null) fallback = id;
            Integer facing = cm.getCameraCharacteristics(id)
                    .get(CameraCharacteristics.LENS_FACING);
            if (facing != null && facing == wanted) return id;
        }
        return fallback;
    }
}
