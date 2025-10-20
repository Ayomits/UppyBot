import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BumpModule } from './app/bump/bump.module';
import { SettingsModule } from './app/settings/settings.module';
import { AuthModule } from './app/auth/auth.module';
import { UserModule } from './app/users/user.module';
import { GuildModule } from './app/guilds/guild.module';
import { StatsModule } from './app/stats/stats.module';
import { DiscordModule } from './shared/modules/discord/discord.module';

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

    AuthModule,
    UserModule,

    SettingsModule,
    BumpModule,

    GuildModule,

    StatsModule,

    DiscordModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
