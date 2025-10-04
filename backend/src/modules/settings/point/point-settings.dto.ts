import { MonitoringType } from '#/enums/monitoring';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePointSettingsDto {
  @ApiProperty({ type: 'number', minimum: 0, required: true })
  default: number;

  @ApiProperty({ type: 'number', minimum: 0, required: true })
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
