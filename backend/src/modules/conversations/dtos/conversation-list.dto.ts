import { User } from '../../users/users.entity';
import { Message } from '../../message-history/message-history.entity';

export class ConversationListDto {
  id: string;
  name: string;
  type: string;
  participants: Partial<User>[];
  last_message?: Partial<Message>;
  unread_count: number;
  created_at: Date;
  updated_at: Date;
}
