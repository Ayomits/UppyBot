import { MonitoringType } from '#/enums/monitoring';
import { BumpBan } from '#/models/bump-ban.model';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { DateTime } from 'luxon';

export class CreateBumpUserDto {
  @ApiProperty({ type: 'string', name: 'guildId' })
  @IsString()
  guildId: string;

  @ApiProperty({ type: 'string', name: 'userId' })
  @IsString()
  userId: string;

  @ApiProperty({ type: 'number', name: 'type' })
  @IsEnum(Object.values(MonitoringType))
  type: number;
}

export class BumpUserFilterDto {
  @ApiProperty({
    type: Date,
    example: DateTime.now().minus({ days: 770 }).toJSDate(),
  })
  @IsDateString()
  from: Date;

  @ApiProperty({ type: Date, example: DateTime.now().toJSDate() })
  @IsDateString()
  to: Date;

  @ApiProperty({ type: 'boolean', required: false })
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  withBumpBan: boolean;
}

export class FindBumpUserResponse {
  @ApiProperty({ type: 'number' })
  disboardMonitoring: number;

  @ApiProperty({ type: 'number' })
  dsMonitoring: number;

  @ApiProperty({ type: 'number' })
  sdcMonitoring: number;

  @ApiProperty({ type: 'number' })
  serverMonitoring: number;

  @ApiProperty({ type: 'number' })
  points: number;
}

export class LeaderboardPaginationResponse {
  @ApiProperty({
    type: [FindBumpUserResponse],
  })
  items: FindBumpUserResponse[];
  @ApiProperty({
    type: 'boolean',
  })
  hasNext: boolean;
  @ApiProperty({
    type: 'number',
  })
  maxPages: number;
  @ApiProperty({
    type: 'number',
  })
  count: number;
}

export class LeadearboardFilter {
  @ApiProperty({
    type: Date,
    example: DateTime.now().minus({ days: 770 }).toJSDate(),
  })
  @IsDateString()
  from: Date;

  @ApiProperty({ type: Date, example: DateTime.now().toJSDate() })
  @IsDateString()
  to: Date;

  @ApiProperty({ type: 'number', minimum: 0, example: 0 })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  offset: number;

  @ApiProperty({ type: 'number', minimum: 10, maximum: 50, example: 10 })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  limit: number;
}

export class BumpUserInfoResponse {
  @ApiProperty({ type: FindBumpUserResponse })
  user: FindBumpUserResponse;
  @ApiProperty({ type: BumpBan })
  bumpBan: BumpBan | null;
}
