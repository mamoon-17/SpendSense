import { Body, Controller, Post } from '@nestjs/common';
import { CreateInvitationDto } from './dtos/Invitation.dto';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationService: InvitationsService) {}

  @Post()
  async sendInvitation(@Body() invitation: CreateInvitationDto) {
    return this.invitationService.createInvitation(invitation);
  }
}
