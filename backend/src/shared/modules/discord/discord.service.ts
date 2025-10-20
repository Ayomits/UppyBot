import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DiscordService {
  constructor(private _httpService: HttpService) {}

  get axiosRef() {
    return this._httpService.axiosRef;
  }
}
