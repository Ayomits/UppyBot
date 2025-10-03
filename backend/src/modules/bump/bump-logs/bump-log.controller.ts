import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { BumpLogService } from './bump-log.service';
import { BumpLogFilter, CreateBumpLogDto } from './bump-log.dto';
import { BumpLog } from '#/models/bump-log.model';

@Controller('/bump-logs')
@ApiExtraModels(BumpLog)
@ApiTags('bump-logs')
export class BumpLogController {
  constructor(@Inject(BumpLogService) private bumpLogService: BumpLogService) {}

  @Get('/:guildId')
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(BumpLog) },
        },
        hasNext: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  findGuildLogs(
    @Param('guildId') guildId: string,
    @Query() { limit = 10, offset = 0, ...rest }: BumpLogFilter,
  ) {
    return this.bumpLogService.findGuildLogs(guildId, {
      limit,
      offset,
      ...rest,
    });
  }

  @Get('/:guildId/:userId')
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(BumpLog) },
        },
        hasNext: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  findUserLogs(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Query() { limit = 10, offset = 0, ...rest }: BumpLogFilter,
  ) {
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
