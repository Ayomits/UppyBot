import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BumpBanFilter,
  BumpBanPaginationResponse,
  CreateBumpBanDto,
} from './bump-ban.dto';
import { BumpBanService } from './bump-ban.service';

@Controller('/bump-ban')
@ApiTags('Бамп.Бан')
export class BumpBanController {
  constructor(private bumpBanService: BumpBanService) {}

  @Get(':guildId/:userId')
  findUserBumpBan(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
  ) {
    return this.bumpBanService.findUserBumpBan(guildId, userId);
  }

  @Get(':guildId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: BumpBanPaginationResponse,
  })
  findBumpBans(
    @Param('guildId') guildId: string,
    @Query(new ValidationPipe({ transform: true })) params: BumpBanFilter,
  ) {
    switch (params.type ?? 'all') {
      case 'active':
        return this.bumpBanService.findActiveBumpBans(
          guildId,
          params.offset,
          params.limit,
        );
      case 'inactive':
        return this.bumpBanService.findInactiveBumpBans(
          guildId,
          params.offset,
          params.limit,
        );
      default:
        return this.bumpBanService.findBumpBans(
          guildId,
          params.offset,
          params.limit,
        );
    }
  }

  @Post()
  createUserBumpBan(@Body() dto: CreateBumpBanDto) {
    return this.bumpBanService.createBumpBan(dto);
  }

  @Post('/:guildId')
  @ApiOperation({
    summary: 'Удаляет неактивные бампы по их id',
  })
  deleteInactiveBumpBans(
    @Param('guildId') guildId: string,
    @Body('ids') ids: string[],
  ) {
    return this.bumpBanService.deleteInactiveBumpBans(guildId, ids);
  }

  @Delete('/:guildId/:userId')
  deleteBumpBan(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
  ) {
    return this.bumpBanService.deleteBumpBan(guildId, userId);
  }
}
