import "dotenv/config";
import cors from "cors";
import expressWs from "express-ws";
import express from "express";
import router, { setupWebSocketRoutes } from "./router";
import ApiError from "@utils/ApiError";
import { errorConverter, errorHandler } from "@middleware/error";

const app = expressWs(express()).app;

// Regular middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Regular HTTP routes
app.use(router);

// Setup WebSocket routes
setupWebSocketRoutes(app);

app.use((req, res, next) => {
  next(new ApiError(404, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
