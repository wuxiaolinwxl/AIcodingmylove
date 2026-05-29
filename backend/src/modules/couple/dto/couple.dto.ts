import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateCoupleInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  spaceName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'anniversaryDate 格式应为 YYYY-MM-DD' })
  anniversaryDate?: string;
}

export class AcceptInviteDto {
  @IsString()
  @MaxLength(32)
  code: string;
}
