import { ApiProperty } from '@nestjs/swagger';

export class UpdateGuildSettingsDto {
  @ApiProperty({ type: [String] })
  bumpRoleIds?: string[];
  @ApiProperty({ type: [String] })
  managerRoles?: string[];
  @ApiProperty({ type: 'string' })
  bumpBanRoleId?: string;
  @ApiProperty({ type: 'string' })
  pingChannelId?: string;
  @ApiProperty({ type: 'string' })
  actionLogChannelId?: string;
  @ApiProperty({ type: 'boolean' })
  useForceOnly: boolean;
  @ApiProperty({ type: 'number' })
  force: number;
}
