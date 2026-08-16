package main

import (
	"context"
	"embed"
	"errors"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

//go:embed public
var staticFiles embed.FS

const (
	defaultPort     = "8080"
	shutdownTimeout = 10 * time.Second
	readTimeout     = 15 * time.Second
	writeTimeout    = 30 * time.Second
	idleTimeout     = 60 * time.Second
)

// withHeaders adds baseline security headers and cache policy.
//
// Everything under /assets/ carries a content hash in its filename, so it is
// safe to cache immutably. Everything else (index.html above all) must be
// revalidated or clients keep loading a bundle that no longer exists.
func withHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := w.Header()
		header.Set("X-Content-Type-Options", "nosniff")
		header.Set("X-Frame-Options", "SAMEORIGIN")
		header.Set("Referrer-Policy", "strict-origin-when-cross-origin")

		if strings.HasPrefix(r.URL.Path, "/assets/") {
			header.Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			header.Set("Cache-Control", "no-cache")
		}

		next.ServeHTTP(w, r)
	})
}

// main serves the embedded "public" directory over HTTP.
// It listens on HOST:PORT, defaulting to ":8080" when PORT is not set,
// and shuts down gracefully on SIGINT/SIGTERM.
func main() {
	htmlContent, err := fs.Sub(staticFiles, "public")
	if err != nil {
		log.Fatal("Failed to load embedded file system:", err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(htmlContent)))
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	host, _ := os.LookupEnv("HOST")
	port, ok := os.LookupEnv("PORT")
	if !ok {
		port = defaultPort
	}

	server := &http.Server{
		Addr:              net.JoinHostPort(host, port),
		Handler:           withHeaders(mux),
		ReadHeaderTimeout: readTimeout,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("Listening on %s...\n", server.Addr)

		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal("Server error:", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatal("Shutdown error:", err)
	}
}
