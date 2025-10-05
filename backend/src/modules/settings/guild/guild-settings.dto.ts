import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateGuildSettingsDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  bumpRoleIds?: string[];

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsOptional()
  managerRoles?: string[];

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsOptional()
  bumpBanRoleId?: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsOptional()
  pingChannelId?: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsOptional()
  actionLogChannelId?: string;

  @ApiProperty({ type: 'boolean' })
  @IsBoolean()
  @IsOptional()
  useForceOnly: boolean;

  @ApiProperty({ type: 'number' })
  @IsInt()
  @Min(0)
  @Max(2 * 3600 * 1_000)
  @IsOptional()
  force: number;
}
