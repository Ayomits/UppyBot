package services

import (
	"api/internal/dtos"
	"api/internal/repositories"
	"api/internal/responses"
	"api/internal/services/validators"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type SettingsService struct {
	settingsRepository repositories.SettingsRepository
}

func NewSettingsService(settingsRepository repositories.SettingsRepository) *SettingsService {
	return &SettingsService{settingsRepository: settingsRepository}
}

func (s *SettingsService) FindSettings(c *fiber.Ctx) error {
	guildId := c.Params("guildId")

	existed, err := s.settingsRepository.FindSettingsByGuildId(guildId)

	if err != nil {
		if errors.Is(mongo.ErrNoDocuments, err) {
			existed, err = s.settingsRepository.InsertSettings(dtos.CreateSettingsDto{
				GuildId:       guildId,
				BumpRoleIds:   []string{},
				BumpBanRoleId: nil,
				UseForceOnly:  false,
				Force:         0,
				LogChannelId:  nil,
				PingChannelId: nil,
			})
			return c.Status(fiber.StatusOK).JSON(existed)
		}
		log.Errorf("%v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(responses.NewInternalError())
	}
	return c.Status(fiber.StatusOK).JSON(existed)
}

func (s *SettingsService) CreateSettings(c *fiber.Ctx) error {
	var body dtos.CreateSettingsDto

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(responses.NewInternalError())
	}

	violations := validators.AppValidatorInstance.Validate(body)

	if violations != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(responses.NewValidationError(violations.Message, violations.Violations))
	}

	existed := s.settingsRepository.ExistsSettingsByGuildId(body.GuildId)

	if existed {
		return c.Status(fiber.StatusBadRequest).JSON(responses.NewBadRequestError("Settings already exists for this guild."))
	}

	settings, err := s.settingsRepository.InsertSettings(body)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(responses.NewInternalError())
	}

	return c.Status(fiber.StatusCreated).JSON(settings)
}

func (s *SettingsService) UpdateSettings(c *fiber.Ctx) error {
	var body dtos.UpdateSettingsDto

	guildId := c.Params("guildId")

	if err := c.BodyParser(&body); err != nil {
		log.Errorf("%v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(responses.NewInternalError())
	}

	violations := validators.AppValidatorInstance.Validate(body)

	if violations != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(responses.NewValidationError(violations.Message, violations.Violations))
	}

	existed := s.settingsRepository.ExistsSettingsByGuildId(guildId)

	if !existed {
		return c.Status(fiber.StatusBadRequest).JSON(responses.NewBadRequestError("Settings does not exists for this guild."))
	}

	settings, err := s.settingsRepository.UpdateSettings(guildId, body)

	if err != nil {
		log.Errorf("%v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(responses.NewInternalError())
	}

	return c.Status(fiber.StatusOK).JSON(settings)
}
