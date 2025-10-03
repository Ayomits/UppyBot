import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BumpLogService } from './bump-log.service';
import { BumpLogFilter } from './bump-log.dto';

@Controller('/bump-logs')
@ApiTags('bump-logs')
export class BumpLogController {
  constructor(@Inject(BumpLogService) private bumpLogService: BumpLogService) {}

  @Get('/:guildId')
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
}
