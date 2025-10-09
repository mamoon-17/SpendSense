import { User } from '../../users/users.entity';

export class MessageHistoryDto {
  id: string;
  content: string;
  sender: Partial<User>;
  status: string;
  sent_at: Date;
  updated_at: Date;
}
