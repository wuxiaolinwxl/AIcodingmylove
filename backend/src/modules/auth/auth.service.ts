import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: { username: string; password: string; email?: string; nickname?: string }) {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      passwordHash,
      email: dto.email || undefined,
      nickname: dto.nickname || dto.username,
    });
    const saved = await this.userRepo.save(user) as User;
    const token = this.jwtService.sign({ sub: saved.id });
    return {
      token,
      user: this.sanitizeUser(saved),
    };
  }

  async login(dto: { username: string; password: string }) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
      select: ['id', 'username', 'nickname', 'email', 'avatarUrl', 'coupleId', 'passwordHash'],
    });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.jwtService.sign({ sub: user.id });
    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: User) {
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
