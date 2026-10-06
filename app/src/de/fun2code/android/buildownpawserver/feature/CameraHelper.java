package de.fun2code.android.buildownpawserver.feature;

import android.content.Context;
import android.graphics.ImageFormat;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.media.Image;
import android.media.ImageReader;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Headless still-image capture with the Camera2 API (no on-screen preview),
 * so a photo can be taken on request from the web UI. Returns a small JSON
 * string and never throws.
 */
public class CameraHelper {

    private static final String TAG = "CameraHelper";

    /**
     * Takes a single JPEG photo.
     *
     * @param front true for the front camera, false for the back camera
     */
    public static synchronized String takePhoto(Context ctx, boolean front) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return FeatureHelper.err("Camera2 requiert Android 5+");
        }
        HandlerThread thread = new HandlerThread("mrd-camera");
        thread.start();
        Handler handler = new Handler(thread.getLooper());

        CameraDevice[] deviceHolder = new CameraDevice[1];
        try {
            CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
            String camId = pickCamera(cm, front);
            if (camId == null) return FeatureHelper.err("Aucune caméra disponible");

            final ImageReader reader = ImageReader.newInstance(1280, 720, ImageFormat.JPEG, 1);

            File dir = new File(ctx.getFilesDir(), "www/html/public/photos");
            dir.mkdirs();
            final File outFile = new File(dir, "photo_" + System.currentTimeMillis() + ".jpg");
            final CountDownLatch savedLatch = new CountDownLatch(1);
            final boolean[] ok = {false};

            reader.setOnImageAvailableListener(new ImageReader.OnImageAvailableListener() {
                @Override
                public void onImageAvailable(ImageReader r) {
                    Image img = null;
                    try {
                        img = r.acquireNextImage();
                        ByteBuffer buf = img.getPlanes()[0].getBuffer();
                        byte[] bytes = new byte[buf.remaining()];
                        buf.get(bytes);
                        FileOutputStream fos = new FileOutputStream(outFile);
                        fos.write(bytes);
                        fos.close();
                        ok[0] = true;
                    } catch (Exception e) {
                        Log.e(TAG, "save image failed", e);
                    } finally {
                        if (img != null) img.close();
                        savedLatch.countDown();
                    }
                }
            }, handler);

            final CountDownLatch openLatch = new CountDownLatch(1);
            cm.openCamera(camId, new CameraDevice.StateCallback() {
                @Override
                public void onOpened(CameraDevice camera) {
                    deviceHolder[0] = camera;
                    try {
                        List<android.view.Surface> surfaces = new ArrayList<android.view.Surface>();
                        surfaces.add(reader.getSurface());
                        camera.createCaptureSession(surfaces,
                                new CameraCaptureSession.StateCallback() {
                                    @Override
                                    public void onConfigured(CameraCaptureSession session) {
                                        try {
                                            CaptureRequest.Builder b = camera.createCaptureRequest(
                                                    CameraDevice.TEMPLATE_STILL_CAPTURE);
                                            b.addTarget(reader.getSurface());
                                            b.set(CaptureRequest.CONTROL_MODE,
                                                    android.hardware.camera2.CameraMetadata.CONTROL_MODE_AUTO);
                                            session.capture(b.build(), null, handler);
                                        } catch (Exception e) {
                                            Log.e(TAG, "capture failed", e);
                                            openLatch.countDown();
                                        }
                                    }

                                    @Override
                                    public void onConfigureFailed(CameraCaptureSession session) {
                                        Log.e(TAG, "session configure failed");
                                        openLatch.countDown();
                                    }
                                }, handler);
                    } catch (Exception e) {
                        Log.e(TAG, "createCaptureSession failed", e);
                        openLatch.countDown();
                    }
                }

                @Override
                public void onDisconnected(CameraDevice camera) {
                    openLatch.countDown();
                }

                @Override
                public void onError(CameraDevice camera, int error) {
                    Log.e(TAG, "camera error " + error);
                    openLatch.countDown();
                }
            }, handler);

            openLatch.await(1, TimeUnit.SECONDS);
            boolean saved = savedLatch.await(6, TimeUnit.SECONDS);

            try { reader.close(); } catch (Exception ignored) {}

            if (saved && ok[0]) {
                return "{\"success\":true,\"file\":\"public/photos/" + outFile.getName() + "\"}";
            }
            return FeatureHelper.err("Capture impossible (timeout ou caméra occupée)");
        } catch (Exception e) {
            Log.e(TAG, "takePhoto failed", e);
            return FeatureHelper.err(e.getMessage());
        } finally {
            if (deviceHolder[0] != null) {
                try { deviceHolder[0].close(); } catch (Exception ignored) {}
            }
            thread.quitSafely();
        }
    }

    private static String pickCamera(CameraManager cm, boolean front) throws Exception {
        String fallback = null;
        int wanted = front ? CameraCharacteristics.LENS_FACING_FRONT
                : CameraCharacteristics.LENS_FACING_BACK;
        for (String id : cm.getCameraIdList()) {
            if (fallback == null) fallback = id;
            Integer facing = cm.getCameraCharacteristics(id)
                    .get(CameraCharacteristics.LENS_FACING);
            if (facing != null && facing == wanted) {
                return id;
            }
        }
        return fallback;
    }
}
