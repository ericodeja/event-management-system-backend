declare namespace Express {
  interface Request {
    user?: {
      sub: string;
      role: string;
      username: string;
    };
  }
}
