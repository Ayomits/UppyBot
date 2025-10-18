import { Controller, Get, HttpStatus } from '@nestjs/common';
import { StatsService } from './stats.service';
import { ApiResponse } from '@nestjs/swagger';
import { StatsResponse } from './stats.response';

@Controller('/stats')
export class StatsController {
  constructor(private statService: StatsService) {}

  @Get('/all')
  @ApiResponse({ status: HttpStatus.OK, type: StatsResponse })
  findPublicStats() {
    return this.statService.findPublicStats();
  }
}
