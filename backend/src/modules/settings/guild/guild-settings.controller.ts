import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { GuildSettingsService } from './guild-settings.service';
import { UpdateGuildSettingsDto } from './guild-settings.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UppySettings } from '#/models/guild-settings.model';
import { SecretKeyGuard } from '#/common/guards/secret-key.guard';

@Controller('/guild-settings')
@ApiTags('Настройки.Серверы')
@ApiBearerAuth()
@UseGuards(SecretKeyGuard)
export class GuildSettingsController {
  constructor(
    @Inject(GuildSettingsService)
    private guildSettingsService: GuildSettingsService,
  ) {}

  @Get('/:guildId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: UppySettings,
  })
  findSettings(@Param('guildId') guildId: string) {
    return this.guildSettingsService.findSettings(guildId);
  }

  @Patch('/:guildId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: UppySettings,
  })
  updateSettings(
    @Param('guildId') guildId: string,
    @Body() dto: UpdateGuildSettingsDto,
  ) {
    return this.guildSettingsService.updateSettings(guildId, dto);
  }
}
