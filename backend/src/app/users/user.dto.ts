import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  discordId: string;

  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;
}

class UserGuild {
  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({ type: 'string', nullable: true })
  icon: string | null;

  @ApiProperty({ type: 'string' })
  name: string;
}

export class UserGuildsResponse {
  @ApiProperty({ type: [UserGuild] })
  items: UserGuild;
}

export class UserMeResponse {
  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({ type: 'string' })
  username: string;

  @ApiProperty({ type: 'string', nullable: true })
  global_name: string;

  @ApiProperty({ type: 'string', nullable: true })
  avatar: string;
}
