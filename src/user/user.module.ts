import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { UserModelModule } from '@zimoykin/models';

@Module({
  imports: [UserModelModule],
  controllers: [UserController],
  providers: [UserService, JwtService],
  exports: [UserService]
})
export class UserModule { }
