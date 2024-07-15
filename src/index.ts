import express from "express";
import { Server } from "@/server";

class Application {
  initialize() {
    const app = express();
    const server: Server = new Server(app);
    server.start();
  }
}

const application = new Application();
application.initialize();
