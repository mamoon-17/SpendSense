import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './invitations.entity';
import { ConnectionsModule } from '../connections/connections.module';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation]), ConnectionsModule],
  providers: [InvitationsService],
  controllers: [InvitationsController],
  exports: [InvitationsService],
})
export class InvitationsModule {}
