import { MonitoringType } from '#/enums/monitoring';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePointSettingsDto {
  @ApiProperty({ type: 'number', minimum: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  default: number;

  @ApiProperty({ type: 'number', minimum: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  bonus: number;
}

export class PointSettinsRates {
  @ApiProperty({ type: 'number' })
  default: number;

  @ApiProperty({ type: 'number' })
  bonus: number;
}

export class ExtendedPointSettingsRates extends PointSettinsRates {
  @ApiProperty({ type: 'number' })
  type: number;
}

export class PointSettingsResponse {
  @ApiProperty({
    example: MonitoringType.DiscordMonitoring,
    type: ExtendedPointSettingsRates,
  })
  dsMonitoring: ExtendedPointSettingsRates;

  @ApiProperty({
    example: MonitoringType.SdcMonitoring,
    type: ExtendedPointSettingsRates,
  })
  sdcMonitoring: ExtendedPointSettingsRates;

  @ApiProperty({
    example: MonitoringType.ServerMonitoring,
    type: ExtendedPointSettingsRates,
  })
  serverMonitoring: ExtendedPointSettingsRates;

  @ApiProperty({
    example: MonitoringType.DisboardMonitoring,
    type: ExtendedPointSettingsRates,
  })
  disboardMonitoring: ExtendedPointSettingsRates;
}
