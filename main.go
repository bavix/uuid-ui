package main

import (
	"embed"
	"errors"
	"io/fs"
	"log"
	"net/http"
)

//go:embed public
var staticFiles embed.FS

func main() {
	htmlContent, err := fs.Sub(staticFiles, "public")
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/", http.FileServer(http.FS(htmlContent)))

	err = http.ListenAndServe(":8080", nil)
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
