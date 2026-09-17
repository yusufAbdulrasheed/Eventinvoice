import { withLambda } from "@netlify/aws-lambda-compat";
import serverless from "serverless-http";
import mongoose from "mongoose";
import app from "../../app.js";

// Netlify Functions can reuse a warm container between invocations, so we
// cache the connection promise at module scope instead of reconnecting to
// Mongo on every request. Deliberately doesn't call process.exit() on
// failure (unlike config/db.js, used by the persistent server.js entrypoint)
// — killing the process isn't meaningful inside a function, and would only
// take down the whole warm container instead of just failing this request.
let dbConnection;
const ensureDbConnected = () => {
  if (!dbConnection) {
    dbConnection = mongoose.connect(process.env.MONGO_URI);
  }
  return dbConnection;
};

const serverlessHandler = serverless(app);

export default withLambda(async (event, context) => {
  // Let Netlify freeze/reuse this container without waiting on the open
  // Mongo socket first.
  context.callbackWaitsForEmptyEventLoop = false;
  await ensureDbConnected();
  return serverlessHandler(event, context);
});

// Handles the app's full /api/* surface directly at its real path (e.g.
// /api/auth/login) — no /.netlify/functions/... rewriting, so none of
// app.js's existing /api/... route mounts need to change.
export const config = { path: "/api/*" };
