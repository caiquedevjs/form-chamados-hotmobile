import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service'; 
import { AuthController } from './auth.controller'; 
import { PrismaService } from 'src/prisma.service'; 
import { JwtStrategy } from './jwt.strategy'; 

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'SEGREDO_SUPER_SECRETO', // Em produção, use process.env.JWT_SECRET
      signOptions: { expiresIn: '1d' }, // Token vale por 1 dia
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy],
  exports: [AuthService], // Exportamos caso outros módulos precisem
})
export class AuthModule {}