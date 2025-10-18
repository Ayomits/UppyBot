import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SyncGuildsDto {
  @ApiProperty({
    description: 'Array of guild IDs',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
