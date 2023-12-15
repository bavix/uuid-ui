package main

import (
	"embed"
	"errors"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
)

//go:embed public
var staticFiles embed.FS

func main() {
	htmlContent, err := fs.Sub(staticFiles, "public")
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/", http.FileServer(http.FS(htmlContent)))

	host, _ := os.LookupEnv("HOST")
	port, ok := os.LookupEnv("PORT")
	if !ok {
		port = "8080"
	}

	addr := net.JoinHostPort(host, port)
	log.Printf("Listening on %s...\n", addr)

	err = http.ListenAndServe(addr, nil)
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
