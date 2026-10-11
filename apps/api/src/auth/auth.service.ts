import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        permissions: user.permissions,
      },
    };
  }

  async refresh(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== email) throw new UnauthorizedException();
    return this.generateTokens(user.id, user.email);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isAdmin: true, permissions: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpires = this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      this.jwt.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
