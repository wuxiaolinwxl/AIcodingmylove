import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateMemoryDto {
  @IsIn(['photo', 'video', 'song', 'text', 'file'])
  type: 'photo' | 'video' | 'song' | 'text' | 'file';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  ossKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  ossUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  coverUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5_000_000_000)
  fileSize?: number;

  @IsDateString()
  memoryDate: string;
}
