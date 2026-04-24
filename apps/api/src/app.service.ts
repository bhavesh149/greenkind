import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { name: string; version: string } {
    return { name: 'GreenKind API', version: '0.0.1' };
  }
}
