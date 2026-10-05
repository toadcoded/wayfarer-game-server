package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	world "copperlantern/world"
)

func main() {
	address := os.Getenv("COPPER_LANTERN_ADDR")
	if address == "" {
		address = "127.0.0.1:8080"
	}
	gateway, err := world.NewGateway(world.WelcomeGardenWorld())
	if err != nil {
		log.Fatalf("gateway world validation failed: %v", err)
	}
	server := &http.Server{Addr: address, Handler: gateway.Handler(), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 2 * time.Minute}
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-stop
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("gateway shutdown: %v", err)
		}
	}()
	log.Printf("Copper Lantern session gateway listening on %s", address)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
