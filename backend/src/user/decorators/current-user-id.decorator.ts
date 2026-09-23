import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub;
  },
); // creates a custom decorator that extracts the user ID from the request object. The user ID is expected to be stored in the 'sub' property of the user object, which is typically set by an authentication middleware (e.g., JWT strategy).
