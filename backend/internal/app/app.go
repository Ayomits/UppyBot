package app

import "github.com/gofiber/fiber/v2"

func Run() {
	app := fiber.New()

	// define your routes here

	app.Listen(":8080")
}
