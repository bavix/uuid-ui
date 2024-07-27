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

// main is the entry point of the program.
// It serves the HTML content from the "public" directory.
// It listens on the address specified by the environment variables HOST and PORT,
// defaulting to "127.0.0.1:8080" if the variables are not set.
func main() {
	// Load the embedded file system and get the "public" directory.
	htmlContent, err := fs.Sub(staticFiles, "public")
	if err != nil {
		log.Fatal("Failed to load embedded file system:", err) // Exit if the embedded file system cannot be loaded
	}

	// Create a file server to serve the HTML content.
	fileServer := http.FileServer(http.FS(htmlContent))

	// Set the handler for the root path ("/") to the file server.
	http.Handle("/", fileServer)

	// Get the host and port from the environment variables.
	host, _ := os.LookupEnv("HOST")  // Get the host from the environment variable, defaulting to "" if not set
	port, ok := os.LookupEnv("PORT") // Get the port from the environment variable, defaulting to "" if not set
	if !ok {
		port = "8080" // Default port is 8080
	}

	// Create the address to listen on.
	addr := net.JoinHostPort(host, port) // Join the host and port with a colon separator

	// Log the address we are listening on.
	log.Printf("Listening on %s...\n", addr)

	// Start the server.
	// The server will listen indefinitely until it is stopped.
	// If an error occurs that is not due to the server being closed,
	// the error will be logged and the program will exit.
	err = http.ListenAndServe(addr, nil)
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal("Server error:", err) // Exit if there is an error other than the server being closed
	}
}
