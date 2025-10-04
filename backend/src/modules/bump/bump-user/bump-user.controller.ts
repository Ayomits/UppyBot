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
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BumpUserService } from './bump-user.service';
import {
  BumpUserFilterDto,
  CreateBumpUserDto,
  FindBumpUserResponse,
  LeadearboardFilter,
  LeaderboardPaginationResponse,
} from './bump-user.dto';

@Controller('/bump-users')
@ApiTags('Бамп.Пользователи')
export class BumpUserController {
  constructor(
    @Inject(BumpUserService) private bumpUserService: BumpUserService,
  ) {}

  @Get(':guildId/users/:userId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: FindBumpUserResponse,
  })
  // Public
  findBumpUser(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Query() qFilter: BumpUserFilterDto,
  ) {
    return this.bumpUserService.findBumpUser(
      guildId,
      userId,
      qFilter.from,
      qFilter.to,
    );
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: LeaderboardPaginationResponse,
  })
  @Get('/:guildId/leadearboard')
  leaderBoard(
    @Param('guildId') guildId: string,
    @Query() qFilter: LeadearboardFilter,
  ) {
    return this.bumpUserService.leaderBoard(
      guildId,
      qFilter.from,
      qFilter.to,
      qFilter.limit,
      qFilter.offset,
    );
  }

  @Post()
  // ADMIN OR BOT
  createBumpUser(@Body() dto: CreateBumpUserDto) {
    return this.bumpUserService.createBumpUser(dto);
  }
}
