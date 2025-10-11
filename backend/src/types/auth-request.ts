import { AuthPayload } from '#/app/auth/auth.dto';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}
