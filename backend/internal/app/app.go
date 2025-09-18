package app

import (
	_ "api/cmd/docs"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
)

func Run() {
	app := fiber.New()

	// define your routes here

	api := app.Group("/api")

	api.Get("/docs/*", swagger.HandlerDefault)

	app.Listen(":8088")
}
