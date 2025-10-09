import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, ConnectionStatus } from './connections.entity';
import { Repository } from 'typeorm';
import { CreateConnectionDto } from './dtos/createConnection.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection) private readonly repo: Repository<Connection>,
  ) {}

  async createConnection(connection: CreateConnectionDto): Promise<Connection> {
    const old_connection = await this.repo.findOne({
      where: [
        {
          requester: { id: connection.requester_id },
          receiver: { id: connection.receiver_id },
        },
        {
          requester: { id: connection.receiver_id },
          receiver: { id: connection.requester_id },
        },
      ],
    });

    if (old_connection) {
      return old_connection;
    }

    const new_connection = this.repo.create({
      requester: { id: connection.requester_id },
      receiver: { id: connection.receiver_id },
    });
    await this.repo.save(new_connection);
    return new_connection;
  }

  async acceptRequest(receiver_id: string): Promise<Connection> {
    const connection = await this.repo.findOne({
      where: {
        receiver: { id: receiver_id },
        status: ConnectionStatus.Pending,
      },
    });

    if (!connection) {
      throw new Error('No pending connection request found');
    }

    connection.status = ConnectionStatus.Connected;
    connection.accepted_at = new Date();
    await this.repo.save(connection);
    return connection;
  }

  async getConnectionByUserId(user_id: string): Promise<Connection | null> {
    return this.repo.findOne({
      where: [
        { requester: { id: user_id }, status: ConnectionStatus.Connected },
        { receiver: { id: user_id }, status: ConnectionStatus.Connected },
      ],
    });
  }
}
