import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString, Max, Min } from 'class-validator';

export class UpdateGuildSettingsDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  bumpRoleIds?: string[];

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  managerRoles?: string[];

  @ApiProperty({ type: 'string' })
  @IsString()
  bumpBanRoleId?: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  pingChannelId?: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  actionLogChannelId?: string;

  @ApiProperty({ type: 'boolean' })
  @IsBoolean()
  useForceOnly: boolean;

  @ApiProperty({ type: 'number' })
  @IsInt()
  @Min(0)
  @Max(2 * 3600 * 1_000)
  force: number;
}
