import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Populated by express.json({ verify }) in main for Stripe webhooks. */
      rawBody?: Buffer;
    }
  }
}

export {};
