import { ApiProperty } from '@nestjs/swagger';
import { DateTime } from 'luxon';

export class CreateBumpUserDto {
  @ApiProperty({ type: 'string', name: 'guildId' })
  guildId: string;

  @ApiProperty({ type: 'string', name: 'userId' })
  userId: string;

  @ApiProperty({ type: 'number', name: 'type' })
  type: number;
}

export class BumpUserFilterDto {
  @ApiProperty({
    type: Date,
    example: DateTime.now().minus({ days: 770 }).toJSDate(),
  })
  from: Date;
  @ApiProperty({ type: Date, example: DateTime.now().toJSDate() })
  to: Date;
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
  @ApiProperty({ type: 'string' })
  userId: string;
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
}

export class LeadearboardFilter {
  @ApiProperty({
    type: Date,
    example: DateTime.now().minus({ days: 770 }).toJSDate(),
  })
  from: Date;
  @ApiProperty({ type: Date, example: DateTime.now().toJSDate() })
  to: Date;
  @ApiProperty({ type: 'number', minimum: 0, example: 0 })
  offset: number;
  @ApiProperty({ type: 'number', minimum: 10, maximum: 50, example: 10 })
  limit: number;
}
