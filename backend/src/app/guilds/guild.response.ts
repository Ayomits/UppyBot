import { ApiProperty } from '@nestjs/swagger';

export class GuildCountResponse {
  @ApiProperty({ type: 'number' })
  count: number;
}
