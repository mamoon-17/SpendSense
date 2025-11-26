import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordService } from '../interfaces/password.interface';

@Injectable()
export class PasswordService implements IPasswordService {
  private readonly SALT_ROUNDS = 10;

  async generateSalt(): Promise<string> {
    return bcrypt.genSalt(this.SALT_ROUNDS);
  }

  async hash(password: string): Promise<string> {
    const salt = await this.generateSalt();
    return bcrypt.hash(password, salt);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
