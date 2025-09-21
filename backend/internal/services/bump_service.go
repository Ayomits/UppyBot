package services

import (
	"api/internal/dtos"
	"api/internal/repositories"
	"api/internal/responses"
	"api/internal/services/querymap"

	"github.com/gofiber/fiber/v2"
)

type BumpService struct {
	bumpRepository repositories.BumpRepository
}

func NewBumpService(bumpRepository repositories.BumpRepository) *BumpService {
	return &BumpService{
		bumpRepository: bumpRepository,
	}
}

func (s *BumpService) FindUserBumps(c *fiber.Ctx) error {
	guildId := c.Params("guildId")
	userId := c.Params("userId")

	filter, err := querymap.FromURLStringToStruct[dtos.UserBumpQueryDto](c.OriginalURL() + c.BaseURL())

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(responses.NewInternalError())
	}

	values, err := s.bumpRepository.FindUserBumps(guildId, userId, filter.From, filter.To)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(responses.NewInternalError())
	}

	return c.Status(fiber.StatusOK).JSON(values)
}
