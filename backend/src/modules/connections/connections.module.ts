import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from './connections.entity';

@Module({
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  imports: [TypeOrmModule.forFeature([Connection])],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
