import { MonitoringType } from '#/enums/monitoring';
import { BumpBan } from '#/models/bump-ban.model';
import { LiteralEnum } from '#/types/literal-enum';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBumpBanDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  userId: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  guildId: string;

  @ApiProperty({ type: 'number' })
  @IsEnum(Object.values(MonitoringType))
  type: number;
}

export class BumpBanPaginationEntity extends OmitType(BumpBan, ['guildId']) {}

export class BumpBanPaginationResponse {
  @ApiProperty({ type: [BumpBanPaginationEntity] })
  items: BumpBan;

  @ApiProperty({ type: 'boolean' })
  hasNext: boolean;

  @ApiProperty({ type: 'number' })
  maxPages: number;

  @ApiProperty({ type: 'number' })
  count: number;
}

export const BumpBanType = {
  Active: 'active',
  Inactive: 'inactive',
  All: 'all',
};

export type BumpBanType = LiteralEnum<typeof BumpBanType>;

export class BumpBanFilter {
  @ApiProperty({
    name: 'type',
    enum: Object.values(BumpBanType),
    required: false,
  })
  @IsEnum(Object.values(BumpBanType))
  @IsOptional()
  type?: BumpBanType;

  @ApiProperty({
    name: 'offset',
    description: 'Страница. НАЧАЛО С 0',
    example: 0,
    required: true,
  })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  offset: number;

  @ApiProperty({
    name: 'limit',
    description: 'Количество записей',
    maximum: 50,
    minimum: 10,
    example: 10,
    required: true,
  })
  @IsInt()
  @Min(10)
  @Max(50)
  @Transform(({ value }) => parseInt(value, 10) ?? 10)
  limit: number;
}

export class DeleteInactiveBumpBansDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @MinLength(1)
  ids: string[];
}
