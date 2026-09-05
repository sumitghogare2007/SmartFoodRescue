import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack || err);
  const status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (
    message.includes('SSL alert number 80') ||
    message.includes('IP that isn\'t whitelisted') ||
    err.name === 'MongoServerSelectionError'
  ) {
    message = 'MongoDB Atlas connection blocked: Your current IP address is not whitelisted in MongoDB Atlas Network Access. Please add 0.0.0.0/0 (Allow Access from Anywhere) in MongoDB Atlas.';
  }

  res.status(status).json({ success: false, message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
};

