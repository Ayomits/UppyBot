package controllers

import (
	"api/internal/services"

	"github.com/gofiber/fiber/v2"
)

type BumpController struct {
	bumpService services.BumpService
}

func NewBumpController(bumpService services.BumpService) *BumpController {
	return &BumpController{
		bumpService: bumpService,
	}
}

func (co *BumpController) SetupRoutes(router fiber.Router) {
	router.Get("/:guildId/:userId", co.FindUserBumps)
}

// FindUserBumps godoc
//
//	@Summary		Get user bumps statistics
//	@Description	Retrieves bump statistics for a user within date range
//	@Tags			bumps
//	@Accept			json
//	@Produce		json
//	@Param			guildId	path		string	true	"Guild ID"
//	@Param			userId	path		string	true	"User ID"
//	@Param			from	query		string	true	"Start date"	Format(date)
//	@Param			to		query		string	true	"End date"		Format(date)
//	@Success		200		{object}	repositories.UserBumps
//	@Failure		404		{object}	responses.NotFoundError
//	@Failure		422		{object}	responses.ValidationError
//	@Failure		500		{object}	responses.InternalError
//	@Router			/api/bumps/{guildId}/{userId} [get]
//	@Security		ApiKeyAuth
func (co *BumpController) FindUserBumps(c *fiber.Ctx) error {
	return co.bumpService.FindUserBumps(c)
}
