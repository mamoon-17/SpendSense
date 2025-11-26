export interface ITokenService {
  generateToken(payload: any, expiresIn?: string): string;
  verifyToken(token: string): any;
  decodeToken(token: string): any;
}
