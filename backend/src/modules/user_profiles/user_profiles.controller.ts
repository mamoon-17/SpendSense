import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserProfilesService } from './user_profiles.service';
import { CreateUserProfileDTO } from './dtos/createUser_profile.dto';
import { UpdateUserProfileDTO } from './dtos/updateUser_profile.dto';

@Controller('user-profiles')
export class UserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Get()
  async getAllUserProfiles() {
    return this.userProfilesService.getAllUserProfiles();
  }

  @Post()
  async createUserProfile(@Body() payload: CreateUserProfileDTO) {
    return this.userProfilesService.createUserProfile(payload);
  }

  @Get(':id')
  async getUserProfileById(@Param('id') id: string) {
    return this.userProfilesService.getUserProfileById(id);
  }

  @Patch(':id')
  async updateUserProfile(@Param('id') id: string, @Body() payload: UpdateUserProfileDTO) {
    return this.userProfilesService.updateUserProfile(id, payload);
  }

  @Delete(':id')
  async deleteUserProfile(@Param('id') id: string) {
    return this.userProfilesService.deleteUserProfile(id);
  }
}
