import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dtos/createConnection.dto';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionService: ConnectionsService) {}

  @Post()
  createConnection(@Body() connection: CreateConnectionDto) {
    return this.connectionService.createConnection(connection);
  }

  @Patch()
  acceptRequest(@Body() body: any) {
    return this.connectionService.acceptRequest(body.receiver_id);
  }
}
