import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { typeOrmConfig } from './config/database.config';
import { appConfigSchema } from './config/config.types';
import { TypedConfigService } from './config/typed-config.service';
import { authConfig } from './config/auth.config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // inicializa o TypeORM de forma assíncrona, permitindo que as configurações sejam carregadas dinamicamente
      imports: [ConfigModule], //após configurar o ConfigModule, ele é importado aqui para que possamos usar o ConfigService
      inject: [ConfigService],
      useFactory: (configService: TypedConfigService) => ({
        //cria a configuração do TypeORM usando o ConfigService para acessar as variáveis de ambiente
        ...configService.get('database'),
        autoLoadEntities: true, //carrega automaticamente todas as entidades do projeto
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true, // torna o ConfigModule global, permitindo que seja usado em qualquer módulo sem precisar importá-lo novamente
      load: [appConfig, typeOrmConfig, authConfig],
      validationSchema: appConfigSchema,
    }),

    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: TypedConfigService, // sempre que o TypedConfigService for injetado, o NestJS vai usar a instância do ConfigService existente
      useExisting: ConfigService, // apontam para a mesma instância
    },
  ],
})
export class AppModule {}
