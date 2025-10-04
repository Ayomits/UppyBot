import { MonitoringType } from '#/enums/monitoring';
import { BumpLog } from '#/models/bump-log.model';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBumpLogDto {
  @ApiProperty({
    enum: Object.values(MonitoringType),
    required: true,
  })
  type: number;

  @ApiProperty({
    type: 'number',
    minimum: 0,
    required: true,
  })
  points: number;

  @ApiProperty({
    type: 'string',
    required: true,
  })
  messageId: string;
}

export class BumpLogFilter {
  @ApiProperty({
    name: 'type',
    description: 'По какому мониторингу сортировать',
    enum: Object.values(MonitoringType),
    required: false,
  })
  type?: number;

  @ApiProperty({
    name: 'page',
    description: 'Страница. НАЧАЛО С 0',
    example: 0,
    required: true,
  })
  offset: number;

  @ApiProperty({
    name: 'limit',
    description: 'Количество записей',
    maximum: 50,
    minimum: 10,
    example: 10,
    required: true,
  })
  limit: number;
}

export class BumpLogPaginationResponse {
  @ApiProperty({ type: [BumpLog] })
  items: BumpLog[];

  @ApiProperty({ type: 'boolean' })
  hasNext: boolean;
}
