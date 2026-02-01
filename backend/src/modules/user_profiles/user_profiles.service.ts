import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './user_profiles.entity';
import { CreateUserProfileDTO } from './dtos/createUser_profile.dto';
import { UpdateUserProfileDTO } from './dtos/updateUser_profile.dto';

@Injectable()
export class UserProfilesService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profilesRepo: Repository<UserProfile>,
  ) {}

  async getAllUserProfiles(): Promise<UserProfile[]> {
    return this.profilesRepo.find({ relations: ['user'] });
  }

  async getUserProfileById(id: string): Promise<UserProfile> {
    const profile = await this.profilesRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('User profile not found');
    return profile;
  }

  async getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
    return this.profilesRepo.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
  }

  async createUserProfile(payload: CreateUserProfileDTO): Promise<UserProfile> {
    const { user_id, ...rest } = payload;
    const profile = this.profilesRepo.create({
      ...rest,
      user_id,
      user: user_id ? ({ id: user_id } as any) : undefined,
    });

    const savedProfile = await this.profilesRepo.save(profile as UserProfile);
    return savedProfile as UserProfile;
  }

  async updateUserProfile(
    id: string,
    payload: UpdateUserProfileDTO,
  ): Promise<UserProfile> {
    const profile = await this.profilesRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('User profile not found');

    const { user_id, ...rest } = payload;

    Object.assign(profile, rest);

    if (user_id) {
      profile.user_id = user_id;
      (profile as any).user = { id: user_id } as any;
    }

    const savedProfile = await this.profilesRepo.save(profile);
    return savedProfile;
  }

  async deleteUserProfile(id: string): Promise<object> {
    const profile = await this.profilesRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('User profile not found');

    await this.profilesRepo.delete(id);
    return { msg: 'User profile deleted successfully' };
  }
}
