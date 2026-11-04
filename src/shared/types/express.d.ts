declare global {
  namespace Express {
    // * Shape of req.user set by the passport strategies — never includes the password hash
    interface User {
      id: string;
      email: string;
      name: string | null;
    }
  }
}

export {};
