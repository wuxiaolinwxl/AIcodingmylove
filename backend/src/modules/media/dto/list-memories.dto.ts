import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListMemoriesDto {
  @IsOptional()
  @IsIn(['photo', 'video', 'song', 'text', 'file'])
  type?: 'photo' | 'video' | 'song' | 'text' | 'file';

  @IsOptional()
  @IsString()
  @MaxLength(32)
  start?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  end?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
