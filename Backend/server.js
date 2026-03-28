import app from "./app.js";
import connectDB from "./config/database.js";
import { PORTNUM } from "./config/env.js";
const startServer = async () => {
    try {
      await connectDB();
      app.listen(PORTNUM, () => {
        console.log(`Server is running on port ${PORTNUM}`);
      });
    } catch (error) {
      console.error("Error starting the server:", error);
    }
  };
  
  startServer();
