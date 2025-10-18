import { ApiProperty } from '@nestjs/swagger';

export class StatsResponse {
  @ApiProperty({ type: 'number' })
  guilds: number;
  @ApiProperty({ type: 'number' })
  commands: number;
  @ApiProperty({ type: 'number' })
  reminds: number;
}
