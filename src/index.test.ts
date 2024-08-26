import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";

import { Server } from "./server";

describe("auth ci", () => {
  it("example", () => {
    expect(1).toBe(1);
  });
});

describe("POST /api/v1/auth/signup", () => {
  it("should return a list of users", async () => {
    const app = express();
    const server: Server = new Server(app);
    server.start();
    const response = await request(app).post("/api/v1/auth/signup").send({
      firstName: "Nhut",
      lastName: "Thanh",
      email: "gaconght001@gmail.com",
      password: "@Abc123123",
    });
    expect(response.statusCode).toBe(201);
  });
});
