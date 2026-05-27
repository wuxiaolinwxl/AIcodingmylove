import { IsString, MinLength, MaxLength, IsOptional, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;
}
