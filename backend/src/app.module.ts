import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BumpModule } from './modules/bump/bump.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URL'),
        autoCreate: true,
        autoIndex: true,
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    BumpModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
