package app

import (
	_ "api/cmd/docs"
	"api/internal/controllers"
	"api/internal/db"
	"api/internal/repositories"
	"api/internal/services"
	"api/internal/services/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
)

func Run() {
	app := fiber.New()

	database := db.NewMongoDb(config.MongoUrl)

	api := app.Group("/api")

	api.Get("/docs/*", swagger.HandlerDefault)

	settings := api.Group("/settings")
	settingsRepository := repositories.NewSettingsRepository(database)
	settingsService := services.NewSettingsService(*settingsRepository)
	settingsController := controllers.NewSettingsController(*settingsService)
	settingsController.SetupRoutes(settings)

	bumps := api.Group("/bumps")
	bumpsRepository := repositories.NewBumpRepository(database)
	bumpsService := services.NewBumpService(*bumpsRepository)
	bumpsController := controllers.NewBumpController(*bumpsService)
	bumpsController.SetupRoutes(bumps)

	// TODO: Remove when everything will be implemented
	if config.AppEnv == "dev" {
		app.Listen(":8088")
	}
}
