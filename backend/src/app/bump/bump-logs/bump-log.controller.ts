import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BumpLogService } from './bump-log.service';
import {
  BumpLogFilter,
  BumpLogPaginationResponse,
  CreateBumpLogDto,
} from './bump-log.dto';
import { BumpLog } from '#/models/bump-log.model';
import { SecretKeyGuard } from '#/common/guards/secret-key.guard';

@Controller('/bump-logs')
@ApiTags('Бамп.Логи')
@ApiBearerAuth()
@UseGuards(SecretKeyGuard)
export class BumpLogController {
  constructor(@Inject(BumpLogService) private bumpLogService: BumpLogService) {}

  @Get('/:guildId')
  findGuildLogs(
    @Param('guildId') guildId: string,
    @Query(new ValidationPipe({ transform: true })) params: BumpLogFilter,
  ) {
    const { limit = 10, offset = 0, ...rest } = params;
    return this.bumpLogService.findGuildLogs(guildId, {
      limit,
      offset,
      ...rest,
    });
  }

  @Get('/:guildId/:userId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: BumpLogPaginationResponse,
  })
  findUserLogs(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Query() params: any,
  ) {
    console.log(params);
    const { limit = 10, offset = 0, ...rest } = params;
    return this.bumpLogService.findUserLogs(guildId, userId, {
      limit,
      offset,
      ...rest,
    });
  }

  @Post('/:guildId/:userId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: BumpLog,
  })
  createBumpLog(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Body() dto: CreateBumpLogDto,
  ) {
    return this.bumpLogService.createLog(guildId, userId, dto);
  }
}
