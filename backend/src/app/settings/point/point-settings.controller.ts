import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PointSettingsService } from './point-settings.service';
import {
  PointSettingsResponse,
  PointSettinsRates,
  UpdatePointSettingsDto,
} from './point-settings.dto';
import { SecretKeyGuard } from '#/common/guards/secret-key.guard';

@Controller('/point-settings')
@ApiTags('Настройки.Поинты')
@ApiBearerAuth()
@UseGuards(SecretKeyGuard)
export class PointSettingsController {
  constructor(private pointSettings: PointSettingsService) {}

  @Get('/:guildId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: PointSettingsResponse,
  })
  findSettings(@Param('guildId') guildId: string) {
    return this.pointSettings.findSettings(guildId);
  }

  @Get('/:guildId/:type')
  @ApiResponse({
    status: HttpStatus.OK,
    type: PointSettinsRates,
  })
  findSettingsByType(
    @Param('guildId') guildId: string,
    @Param('type') type: number,
  ) {
    return this.pointSettings.findByType(guildId, type);
  }

  @Patch('/:guildId/:type')
  @ApiResponse({
    status: HttpStatus.OK,
    type: PointSettinsRates,
  })
  updateSettingsByType(
    @Param('guildId') guildId: string,
    @Param('type') type: number,
    @Body() dto: UpdatePointSettingsDto,
  ) {
    return this.pointSettings.updateSettings(guildId, type, dto);
  }
}
