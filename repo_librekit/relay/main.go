package main

import (
	"io"
	"log"
	"net/http"
	"strings"
)

const (
	apiBase = "https://www.gimkit.com"
)

func main() {
	log.Println("Starting...")

	log.Println("Now listening on port 8080.")

	err := http.ListenAndServe(":8080", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		w.Header().Add("Access-Control-Allow-Headers", "Accept, Content-Type, Cookie")
		w.Header().Add("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.Header().Add("Server", "librekit-relay")
			w.Header().Add("Content-Type", "text/plain")
			w.WriteHeader(200)
			return
		}

		// NOTE: Gimkit does not have an /api/v1/connection-test endpoint. This is librekit-specific.

		if r.URL.Path == "/api/v1/connection-test" {
			w.Header().Add("Content-Type", "text/plain")
			w.WriteHeader(200)
			w.Write([]byte("ok"))
			return
		}

		// NOTE: Gimkit does not have an /api/v1/jid endpoint. This is librekit-specific.

		if r.URL.Path == "/api/v1/jid" {
			w.Header().Add("Server", "librekit-relay")
			w.Header().Add("Content-Type", "text/plain")

			request, err := http.NewRequest(r.Method, apiBase+"/join", nil)

			if err != nil {
				w.WriteHeader(500)
				_, _ = w.Write([]byte("Internal Server Error\n"))
			}

			request.Header.Set("User-Agent", "librekit-relay")
			request.Header.Add("Accept", "text/html")

			response, err := http.DefaultClient.Do(request)

			if err != nil {
				w.WriteHeader(500)
				_, _ = w.Write([]byte("Internal Server Error\n"))
				return
			}

			body, err := io.ReadAll(response.Body)

			if err != nil {
				w.WriteHeader(500)
				_, _ = w.Write([]byte("Internal Server Error\n"))
				return
			}

			splitJID := strings.Split(string(body), "<meta property=\"int:jid\" content=\"")

			if len(splitJID) != 2 {
				w.WriteHeader(500)
				_, _ = w.Write([]byte("Internal Server Error\n"))
				return
			}

			splitJID = strings.Split(splitJID[1], "\">")

			if 2 > len(splitJID) {
				w.WriteHeader(500)
				_, _ = w.Write([]byte("Internal Server Error\n"))
				return
			}

			jid := splitJID[0]

			w.WriteHeader(200)
			_, _ = w.Write([]byte(jid))

			return
		}

		// Reject all non-API requests.

		if !strings.HasPrefix(r.URL.Path, "/api") && !strings.HasPrefix(r.URL.Path, "/pages") && !strings.HasPrefix(r.URL.Path, "/logout") {
			w.Header().Add("Server", "librekit-relay")
			w.Header().Add("Content-Type", "text/plain")
			w.WriteHeader(400)
			_, _ = w.Write([]byte("Bad request\n"))
			return
		}

		// Send a request to the Gimkit API server

		var request *http.Request
		var err error

		request, err = http.NewRequest(r.Method, apiBase+r.URL.Path, r.Body)

		if err != nil {
			w.Header().Add("Server", "librekit-relay")
			w.Header().Add("Content-Type", "text/plain")
			w.WriteHeader(500)
			_, _ = w.Write([]byte("Internal server error\n"))
			return
		}

		request.Header.Set("User-Agent", "librekit-relay")
		request.Header.Set("Origin", apiBase)

		if r.Header.Get("Accept") != "" {
			request.Header.Set("Accept", r.Header.Get("Accept"))
		}

		if r.Header.Get("Cookie") != "" {
			request.Header.Set("Cookie", r.Header.Get("Cookie"))
		}

		if r.Header.Get("Content-Type") != "" {
			request.Header.Set("Content-Type", r.Header.Get("Content-Type"))
		}

		response, err := http.DefaultClient.Do(request)

		if err != nil {
			w.Header().Add("Server", "librekit-relay")
			w.Header().Add("Content-Type", "text/plain")
			w.WriteHeader(500)
			_, _ = w.Write([]byte("Internal server error\n"))
		}

		w.Header().Add("Server", "librekit-relay")

		// Ugly solution for CORS cookies.
		// See: https://stackoverflow.com/a/46412839

		if response.Header.Get("Set-Cookie") != "" {
			w.Header().Add("Set-Cookie", strings.ReplaceAll(response.Header.Get("Set-Cookie"), "HttpOnly", "HttpOnly SameSite=None Secure"))
		}

		w.WriteHeader(response.StatusCode)

		io.Copy(w, response.Body)
	}))

	if err != nil {
		panic(err)
	}
}
