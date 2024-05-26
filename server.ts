import express, { Express, NextFunction, Request, Response } from "express";
import "./src/dbconnection";
import RoutesHandler from "./src/routes/routesManager";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { cstmConsole, currTime } from "./src/middleware/responseActions";
import dotEnv from "dotenv";
import connectDB from "./src/dbconnection";
import cors from "cors";
import fileUpload from "express-fileupload";
import {
  scheduleSavingChartData,
  scheduleSubscriptionUpdate,
  scheduleTransactionVerificationCheck,
} from "./src/services/cronJob.services";
import  cron  from 'node-cron';
import { getCronCollectionData } from "./src/controller/magicEden.controler";
dotEnv.config();

const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;

// connection with db
connectDB();

const app: Express = express();

app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials:true,
    exposedHeaders: ['Set-Cookie']
  })
);

app.use(fileUpload());

// app.use(function (req: Request, res: Response, next: NextFunction) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   cstmConsole.flag(`${currTime()} -- ${req.method}: ${req.originalUrl}`);
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "X-Requested-With,content-type"
//   );
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   next();
// });

// app.use(function (req: Request, res: Response, next: NextFunction) {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
//   cstmConsole.flag(`${currTime()} -- ${req.method}: ${req.originalUrl}`);
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "X-Requested-With,content-type"
//   );
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   next();
// });

  app.use(function (req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = ["*"]; // Add other allowed origins as needed
    const origin = req.headers.origin || "*";

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    cstmConsole.flag(`${currTime()} -- ${req.method}: ${req.originalUrl}`);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers", 
      "X-Requested-With,content-type,access-control-expose-headers" // Add access-control-expose-headers to the allowed headers
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Expose-Headers", "Set-Cookie"); // Expose Set-Cookie header
    next();
  });

  //routes
app.use("/api/user", RoutesHandler.userRoutes);
app.use("/api/admin", RoutesHandler.adminRoutes);
app.use("/api/ordinals", RoutesHandler.magicEdenRoutes);
app.use("/api/plans", RoutesHandler.plansRoutes);
app.use("/api/transactions", RoutesHandler.transactionRoutes);

scheduleSubscriptionUpdate();
scheduleTransactionVerificationCheck();

// scheduleSavingChartData();

// const now = new Date();
// const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0); 
// const delay = startTime.getTime() - now.getTime();


// setTimeout(scheduleSavingChartData, delay);

app.listen(PORT, () => {
  console.log(`\n\nServer is running at: ${BASE_URL}:${PORT}`);
});
