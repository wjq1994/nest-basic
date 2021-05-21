import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  public aaa = 1;
  getHello(): string {
    console.log(this.aaa++);
    let i = 0;
    for (let index = 0; index < 1000000000; index++) {
      i++;
      if (i === 1000000000) {
        console.log(11111);
      }
    }
    console.log(2222);
    return 'Hello World!';
  }
}
