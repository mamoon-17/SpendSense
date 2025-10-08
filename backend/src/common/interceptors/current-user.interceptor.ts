import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.session?.userId;

    if (!userId) {
      return next.handle(); // no user, just continue
    }

    // Convert promise to observable and attach user before continuing
    return from(this.usersService.getUserById(userId)).pipe(
      switchMap((user) => {
        request.currentUser = user;
        return next.handle();
      }),
    );
  }
}
