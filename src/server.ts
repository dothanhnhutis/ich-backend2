import "express-async-errors";
import express, { Application, Request, Response, NextFunction } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import http from "http";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";

import configs from "@/configs";
import { Customerror, IErrorResponse, NotFoundError } from "@/error-handler";
import { appRouter } from "@/routes";
import { initRedis } from "@/redis/connection";
import deserializeUser from "./middleware/deserializeUser";

const SERVER_PORT = 4000;
export class Server {
  constructor(private app: Application) {}

  public start() {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.errorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application) {
    app.set("trust proxy", 1);
    app.use(morgan(configs.NODE_ENV == "production" ? "combined" : "dev"));
    app.use(helmet());
    app.use(
      cors({
        origin: configs.CLIENT_URL,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      })
    );
    initRedis();
    app.use(deserializeUser);
    // app.use(
    //   session({
    //     secret: configs.SESSION_SECRET,
    //     name: configs.SESSION_KEY_NAME,
    //     cookie: {
    //       path: "/",
    //       httpOnly: true,
    //       secure: configs.NODE_ENV == "production",
    //     },
    //     // genid: (req) => {
    //     //   const randomId = crypto.randomBytes(10).toString("hex");
    //     //   return `${req.session.user?.id}:${randomId}`;
    //     // },
    //   })
    // );
  }

  private standardMiddleware(app: Application) {
    app.use(compression());
    app.use(express.json({ limit: "200mb" }));
    app.use(express.urlencoded({ extended: true, limit: "200mb" }));
  }

  private routesMiddleware(app: Application): void {
    appRouter(app);
  }

  private errorHandler(app: Application): void {
    // handle 404
    app.use("*", (req: Request, res: Response, next: NextFunction) => {
      throw new NotFoundError();
    });
    // handle error
    app.use(
      (
        error: IErrorResponse,
        _req: Request,
        res: Response,
        next: NextFunction
      ) => {
        if (error instanceof Customerror) {
          if (error.statusCode == StatusCodes.UNAUTHORIZED) {
            res.clearCookie("session");
          }
          return res.status(error.statusCode).json(error.serializeErrors());
        }
        console.log(error);
        // req.session.destroy(function (err) {});
        // res.clearCookie("session");
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ message: "Something went wrong" });
      }
    );
  }

  private async startServer(app: Application) {
    try {
      const httpServer: http.Server = new http.Server(app);
      this.startHttpServer(httpServer);
    } catch (error) {
      console.log("GatewayService startServer() error method:", error);
    }
  }

  private startHttpServer(httpServer: http.Server) {
    try {
      console.log(`App server has started with process id ${process.pid}`);
      httpServer.listen(SERVER_PORT, () => {
        console.log(`App server running on port ${SERVER_PORT}`);
      });
    } catch (error) {
      console.log("AppService startServer() method error:", error);
    }
  }
}
