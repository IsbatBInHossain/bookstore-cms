import express from 'express';
import type { Express, Request, Response } from 'express';

const app: Express = express();
const port = process.env.PORT || 3001;

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from the Account Service!',
    service: 'account-service',
  });
});

const main = async () => {
  try {
    app.listen(port, () => {
      console.log(
        `[account-service]: Server is running at http://localhost:${port}`
      );
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

main();
