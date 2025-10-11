import { IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  discordId: string;

  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;
}
