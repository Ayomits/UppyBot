import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GuildService } from './guild.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GuildCountResponse } from './guild.response';
import { SecretKeyGuard } from '#/common/guards/secret-key.guard';
import { SyncGuildsDto } from './guilds.dto';

@Controller('/guilds')
@ApiTags('Серверы')
export class GuildController {
  constructor(private guildService: GuildService) {}

  @Get('count')
  @ApiResponse({
    status: HttpStatus.OK,
    type: GuildCountResponse,
  })
  findCount() {
    return this.guildService.countGuilds();
  }

  @Post('sync')
  @UseGuards(SecretKeyGuard)
  @ApiBearerAuth()
  syncGuilds(@Body() dto: SyncGuildsDto) {
    return this.guildService.syncGuilds(dto);
  }

  @Post(':id')
  @UseGuards(SecretKeyGuard)
  @ApiBearerAuth()
  create(@Param('id') id: string) {
    this.guildService.create(id);
  }

  @Delete(':id')
  @UseGuards(SecretKeyGuard)
  @ApiBearerAuth()
  delete(@Param('id') id: string) {
    this.guildService.delete(id);
  }
}
