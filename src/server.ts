import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { setupSocket } from './config/socket';

const startServer = () => {
  const port = env.PORT;
  
  // Create HTTP server
  const httpServer = createServer(app);

  // Setup Socket.IO
  setupSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
};

startServer();
