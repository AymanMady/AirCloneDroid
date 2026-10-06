package de.fun2code.android.buildownpawserver.feature;

import android.util.Base64;
import android.util.Log;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Socket;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

/**
 * Minimal SMTPS (implicit TLS, port 465) e-mail sender using only the JDK, so
 * no extra dependency is needed. The user supplies their own SMTP account
 * (e.g. Gmail with an app password). Returns a small JSON string, never throws.
 */
public class EmailHelper {

    private static final String TAG = "EmailHelper";

    public static String send(String host, int port, String user, String pass,
                              String to, String subject, String body) {
        if (host == null || host.length() == 0) return FeatureHelper.err("Serveur SMTP manquant");
        if (to == null || to.length() == 0) return FeatureHelper.err("Destinataire manquant");
        if (port <= 0) port = 465;

        SSLSocket socket = null;
        try {
            SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
            socket = (SSLSocket) factory.createSocket();
            socket.connect(new java.net.InetSocketAddress(host, port), 10000);
            socket.setSoTimeout(10000);
            socket.startHandshake();

            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), "UTF-8"));
            OutputStream out = socket.getOutputStream();

            expect(in, "220");
            send(out, "EHLO MyRemoteDroid");
            readMulti(in, "250");

            send(out, "AUTH LOGIN");
            expect(in, "334");
            send(out, b64(user));
            expect(in, "334");
            send(out, b64(pass));
            expect(in, "235");

            send(out, "MAIL FROM:<" + user + ">");
            expect(in, "250");
            send(out, "RCPT TO:<" + to + ">");
            expect(in, "250");
            send(out, "DATA");
            expect(in, "354");

            String subj = subject == null ? "(sans objet)" : subject;
            String msg = "From: " + user + "\r\n"
                    + "To: " + to + "\r\n"
                    + "Subject: " + subj + "\r\n"
                    + "MIME-Version: 1.0\r\n"
                    + "Content-Type: text/plain; charset=UTF-8\r\n"
                    + "\r\n"
                    + (body == null ? "" : body).replace("\r\n.", "\r\n..")
                    + "\r\n.";
            send(out, msg);
            expect(in, "250");

            send(out, "QUIT");
            return "{\"success\":true}";
        } catch (Exception e) {
            Log.e(TAG, "send failed", e);
            return FeatureHelper.err(e.getMessage());
        } finally {
            if (socket != null) try { socket.close(); } catch (Exception ignored) {}
        }
    }

    private static void send(OutputStream out, String line) throws Exception {
        out.write((line + "\r\n").getBytes("UTF-8"));
        out.flush();
    }

    private static void expect(BufferedReader in, String code) throws Exception {
        String line = in.readLine();
        if (line == null || !line.startsWith(code)) {
            throw new Exception("Réponse SMTP inattendue : " + line);
        }
    }

    /** Reads a possibly multi-line reply ("250-..." lines then "250 ..."). */
    private static void readMulti(BufferedReader in, String code) throws Exception {
        String line;
        do {
            line = in.readLine();
            if (line == null || !line.startsWith(code)) {
                throw new Exception("Réponse SMTP inattendue : " + line);
            }
        } while (line.length() > 3 && line.charAt(3) == '-');
    }

    private static String b64(String s) throws Exception {
        return Base64.encodeToString(s.getBytes("UTF-8"), Base64.NO_WRAP);
    }
}
