import { IsOptional, IsString, Matches, IsBoolean, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'solarBirthday 格式应为 YYYY-MM-DD' })
  solarBirthday?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'lunarBirthday 格式应为 YYYY-MM-DD' })
  lunarBirthday?: string | null;

  @IsOptional()
  @IsBoolean()
  lunarIsLeap?: boolean;
}
