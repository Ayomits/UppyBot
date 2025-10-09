import { ApiProperty } from '@nestjs/swagger';

export class CreateGuilds {
  @ApiProperty({})
  ids: string[];
}
