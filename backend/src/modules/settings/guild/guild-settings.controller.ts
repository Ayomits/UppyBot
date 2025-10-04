import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
} from '@nestjs/common';
import { GuildSettingsService } from './guild-settings.service';
import { UpdateGuildSettingsDto } from './guild-settings.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UppySettings } from '#/models/guild-settings.model';

@Controller('/guild-settings')
@ApiTags('Настройки.Серверы')
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
