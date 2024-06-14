const { startServer } = require("./server");

async function runServer() {
  try {
    const httpServer = await startServer();
    console.log("Server is running on http://localhost:4000");
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}

runServer();
