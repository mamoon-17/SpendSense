import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.session?.userId;

    if (userId) {
      // Fetch user and attach to request
      return from(
        this.usersService.getUserById(userId).then((user) => {
          request.currentUser = user;
          return next.handle().toPromise();
        }),
      );
    }

    // If no userId, just continue
    return next.handle();
  }
}
