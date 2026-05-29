import { IsOptional, IsString, Matches, IsBoolean, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'solarBirthday 格式应为 YYYY-MM-DD' })
  solarBirthday?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'lunarBirthday 格式应为 YYYY-MM-DD' })
  lunarBirthday?: string | null;

  @IsOptional()
  @IsBoolean()
  lunarIsLeap?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(512)
  avatarUrl?: string | null;
}
