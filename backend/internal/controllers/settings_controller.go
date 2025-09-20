package controllers

import (
	"api/internal/services"

	"github.com/gofiber/fiber/v2"
)

type SettingsController struct {
	settingsService services.SettingsService
}

func NewSettingsController(settingsService services.SettingsService) *SettingsController {
	return &SettingsController{settingsService: settingsService}
}

func (s *SettingsController) SetupRoutes(r fiber.Router) {
	r.Get("/:guildId", s.FindSettings)
	r.Post("/", s.CreateSettings)
	r.Put("/:guildId", s.UpdateSettings)
}

// FindSettings godoc
//
//	@Summary	Finds or create settings
//	@Tags		settings
//	@Accept		json
//	@Produce	json
//	@Param		guildId	path		string	true	"Guild ID"
//	@Success	200		{object}	models.SettingsModel
//	@Failure	404		{object}	responses.NotFoundError
//	@Failure	422		{object}	responses.ValidationError
//	@Failure	500		{object}	responses.InternalError
//	@Router		/api/settings/{guildId} [get]
//	@Security	ApiKeyAuth
func (s *SettingsController) FindSettings(c *fiber.Ctx) error {
	return s.settingsService.FindSettings(c)
}

// CreateSettings godoc
//
//	@Summary	Create settings if not existed
//	@Tags		settings
//	@Accept		json
//	@Produce	json
//	@Param		request	body		dtos.CreateSettingsDto	true	"Settings data"
//	@Success	200		{object}	models.SettingsModel
//	@Failure	400		{object}	responses.BadRequestError
//	@Failure	422		{object}	responses.ValidationError
//	@Failure	500		{object}	responses.InternalError
//	@Router		/api/settings [post]
//	@Security	ApiKeyAuth
func (s *SettingsController) CreateSettings(c *fiber.Ctx) error {
	return s.settingsService.CreateSettings(c)
}

// UpdateSettings godoc
//
//	@Summary	Create settings if not existed
//	@Tags		settings
//	@Accept		json
//	@Produce	json
//	@Param		guildId	path		string					true	"Guild ID"
//	@Param		request	body		dtos.UpdateSettingsDto	true	"Settings data"
//	@Success	201		{object}	models.SettingsModel
//	@Failure	400		{object}	responses.BadRequestError
//	@Failure	404		{object}	responses.NotFoundError
//	@Failure	422		{object}	responses.ValidationError
//	@Failure	500		{object}	responses.InternalError
//	@Router		/api/settings/{guildId} [put]
//	@Security	ApiKeyAuth
func (s *SettingsController) UpdateSettings(c *fiber.Ctx) error {
	return s.settingsService.UpdateSettings(c)
}
