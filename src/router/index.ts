import express from "express";
import { Application } from "express-ws";
import agentRoute, { setupAgentRoutes } from "./agent.route";

const router = express.Router();

// Regular HTTP routes
const defaultRoutes = [
  {
    path: "/agent",
    route: agentRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// WebSocket routes setup function
export const setupWebSocketRoutes = (app: Application) => {
  // Make sure WebSocket routes are set up at the root level
  setupAgentRoutes(app);
};

export default router;
