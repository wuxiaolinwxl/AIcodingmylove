import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.solarBirthday !== undefined) user.solarBirthday = dto.solarBirthday || null;
    if (dto.lunarBirthday !== undefined) user.lunarBirthday = dto.lunarBirthday || null;
    if (dto.lunarIsLeap !== undefined) user.lunarIsLeap = !!dto.lunarIsLeap;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl || null;

    const saved = await this.userRepo.save(user);
    return this.sanitize(saved);
  }

  private sanitize(user: User) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      avatarUrl: user.avatarUrl,
      coupleId: user.coupleId || null,
      solarBirthday: user.solarBirthday || null,
      lunarBirthday: user.lunarBirthday || null,
      lunarIsLeap: !!user.lunarIsLeap,
    };
  }
}
