import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invitation } from './invitations.entity';
import { Repository } from 'typeorm';
import { CreateInvitationDto } from './dtos/Invitation.dto';
import { ConnectionsService } from '../connections/connections.service';
import {
  Connection,
  ConnectionStatus,
} from '../connections/connections.entity';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation) private readonly repo: Repository<Invitation>,
    private readonly connectionsService: ConnectionsService,
  ) {}

  async createInvitation(invitation: CreateInvitationDto): Promise<Invitation> {
    const store: Connection | null =
      await this.connectionsService.getConnectionByUserId(invitation.sent_by);
    if (!store) {
      throw new Error(
        'Sender must have an active connection to send invitations.',
      );
    }
    if (store.status !== ConnectionStatus.Connected) {
      throw new Error('Sender connection must be in Connected status.');
    }

    const newInvitation = this.repo.create(invitation as Partial<Invitation>);
    await this.repo.save(newInvitation);
    return newInvitation;
  }
}
