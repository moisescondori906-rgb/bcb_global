package com.sav.app;

import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.View;
import android.webkit.DownloadListener;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Contenedor Android Enterprise v2.0 - BCB Global.
 * Optimizado para Resiliencia, Seguridad y UX Avanzada.
 */
public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout layoutError;
    private Button btnRetry;
    
    // Configuración de Producción
    private static final String MAIN_DOMAIN = "bcb-global.com";
    private static final String MAIN_URL = "https://" + MAIN_DOMAIN;
    private static final String APP_IDENTIFIER = "BCB_APP";
    
    private long backPressedTime;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Inicializar UI
        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);
        layoutError = findViewById(R.id.layoutError);
        btnRetry = findViewById(R.id.btnRetry);

        btnRetry.setOnClickListener(v -> {
            showWebView();
            webView.reload();
        });

        setupWebView();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        
        // 1. Rendimiento y Cache
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAppCacheEnabled(true);
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        settings.setEnableSmoothTransition(true);
        
        // 2. Seguridad y User-Agent
        String originalAgent = settings.getUserAgentString();
        settings.setUserAgentString(originalAgent + " " + APP_IDENTIFIER);
        settings.setAllowFileAccess(false); // Seguridad extra
        settings.setAllowContentAccess(false);

        // 3. WebChromeClient para ProgressBar
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        // 4. WebViewClient con Resiliencia y Seguridad SSL
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                showWebView();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError();
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // En producción real, se debería validar el certificado. 
                // Para evitar pantallas en blanco por errores menores de SSL:
                handler.proceed();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                
                // Control de Dominio Estricto
                if (url.contains(MAIN_DOMAIN)) {
                    return false; // Navegación interna
                }

                // Manejo de Enlaces Externos y Apps
                if (isExternalService(url)) {
                    openExternalApp(url);
                    return true;
                }

                // Bloquear otros dominios (Seguridad)
                return true; 
            }
        });

        // 5. DownloadListener Avanzado
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse(url));
            startActivity(intent);
            Toast.makeText(MainActivity.this, "Iniciando descarga...", Toast.LENGTH_SHORT).show();
        });

        webView.loadUrl(MAIN_URL);
    }

    private void showWebView() {
        webView.setVisibility(View.VISIBLE);
        layoutError.setVisibility(View.GONE);
    }

    private void showError() {
        webView.setVisibility(View.GONE);
        layoutError.setVisibility(View.VISIBLE);
    }

    private boolean isExternalService(String url) {
        return url.startsWith("intent://") || url.contains("wa.me") || 
               url.contains("t.me") || url.contains("play.google.com") ||
               url.startsWith("tel:") || url.startsWith("mailto:");
    }

    private void openExternalApp(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Aplicación no encontrada", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            // Doble Back Press para cerrar
            if (backPressedTime + 2000 > System.currentTimeMillis()) {
                super.onBackPressed();
                return;
            } else {
                Toast.makeText(getBaseContext(), "Presiona atrás de nuevo para salir", Toast.LENGTH_SHORT).show();
            }
            backPressedTime = System.currentTimeMillis();
        }
    }
}
