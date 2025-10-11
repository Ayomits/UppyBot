import { IsString } from 'class-validator';

export class AuthPayload {
  @IsString()
  discordId: string;
}
