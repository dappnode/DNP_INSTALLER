import http from "http";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import compression from "compression";
import fileUpload from "express-fileupload";
import { helmetConf } from "./helmet";
import cors from "cors";
import socketio from "socket.io";
import path from "path";
import { toSocketIoHandler, wrapHandler } from "./utils";
import { AuthPasswordSession, AuthPasswordSessionParams } from "./auth";
import { AdminPasswordDb } from "./auth/adminPasswordDb";
import { ClientSideCookies, ClientSideCookiesParams } from "./sessions";
import { mapSubscriptionsToEventBus } from "./subscriptions";
import { Logs } from "../logs";
import { EventBus } from "../eventBus";
import {
  getRpcHandler,
  subscriptionsFactory,
  RpcPayload,
  RpcResponse,
  LoggerMiddleware,
  Routes
} from "../types";

export interface HttpApiParams
  extends ClientSideCookiesParams,
    AuthPasswordSessionParams {
  AUTH_IP_ALLOW_LOCAL_IP: boolean;
  HTTP_API_PORT: number | string;
  UI_FILES_PATH: string;
  HTTP_CORS_WHITELIST: string[];
}

export interface HttpRoutes {
  containerLogs: RequestHandler<{ containerName: string }>;
  dataSend: RequestHandler<{}>;
  download: RequestHandler<{ fileId: string }>;
  downloadUserActionLogs: RequestHandler<{}>;
  downloadWireguardConfig: RequestHandler<{ device: string }>;
  fileDownload: RequestHandler<{ containerName: string }>;
  globalEnvs: RequestHandler<{ name: string }>;
  packageManifest: RequestHandler<{ dnpName: string }>;
  publicPackagesData: RequestHandler<{ containerName: string }>;
  sign: RequestHandler<{}>;
  upload: RequestHandler<{}>;
}

/**
 * HTTP API
 *
 * [NOTE] This API is not secure
 * - It can't use HTTPS for the limitations with internal IPs certificates
 *
 * [NOTE] To enable express debugging set ENV DEBUG=express:*
 */
export function startHttpApi({
  params,
  logs,
  routes,
  ethForwardMiddleware,
  routesLogger,
  methods,
  subscriptionsLogger,
  adminPasswordDb,
  eventBus,
  isNewDappmanagerVersion
}: {
  params: HttpApiParams;
  logs: Logs;
  routes: HttpRoutes;
  ethForwardMiddleware: express.RequestHandler;
  routesLogger: LoggerMiddleware;
  methods: Routes;
  subscriptionsLogger: LoggerMiddleware;
  adminPasswordDb: AdminPasswordDb;
  eventBus: EventBus;
  isNewDappmanagerVersion: () => boolean;
}): http.Server {
  const app = express();
  const server = new http.Server(app);
  const io = socketio(server, { serveClient: false });

  // Subscriptions
  const subscriptions = subscriptionsFactory(io, subscriptionsLogger);
  mapSubscriptionsToEventBus(subscriptions, methods, eventBus);

  const rpcHandler = getRpcHandler(methods, routesLogger);

  app.use(helmetConf());
  // Intercept decentralized website requests first
  app.use(ethForwardMiddleware);
  // default options. ALL CORS + limit fileSize and file count
  app.use(fileUpload({ limits: { fileSize: 500 * 1024 * 1024, files: 10 } }));
  // CORS config follows https://stackoverflow.com/questions/50614397/value-of-the-access-control-allow-origin-header-in-the-response-must-not-be-th
  app.use(cors({ credentials: true, origin: params.HTTP_CORS_WHITELIST }));
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: true }));
  // Express uses "ETags" (hashes of the files requested) to know when the file changed
  app.use(express.static(path.resolve(params.UI_FILES_PATH), { maxAge: "1d" }));

  // Sessions
  const sessions = new ClientSideCookies(params);
  app.use(sessions.handler);

  // Auth
  const auth = new AuthPasswordSession(sessions, adminPasswordDb, params);

  // sessionHandler will mutate socket.handshake attaching .session object
  // Then, onlyAdmin will reject if socket.handshake.session.isAdmin !== true
  io.use(toSocketIoHandler(sessions.handler));
  io.use(toSocketIoHandler(auth.onlyAdmin));

  io.on("connection", socket => {
    console.log(`Socket connected`, socket.id);

    // JSON RPC over WebSockets
    socket.on(
      "rpc",
      (rpcPayload: RpcPayload, callback: (res: RpcResponse) => void) => {
        if (typeof callback !== "function")
          return logs.error("JSON RPC over WS req without cb", rpcPayload);

        rpcHandler(rpcPayload)
          .then(callback)
          .catch(error => callback({ error }))
          .catch(error => logs.error("Error on JSON RPC over WS cb", error));
      }
    );

    // If DAPPMANAGER's version has changed reload the client
    if (isNewDappmanagerVersion()) {
      subscriptions.reloadClient.emit({ reason: "New version" });
    }
  });

  app.post("/login-status", auth.loginAdminStatus);
  app.post("/login", auth.loginAdmin);
  app.post("/logout", auth.logoutAdmin);
  app.post("/change-pass", auth.changeAdminPassword);
  app.post("/register", auth.registerAdmin);
  app.post("/recover-pass", auth.recoverAdminPassword);

  // Ping - health check
  app.get("/ping", auth.onlyAdmin, (_, res) => res.send({}));

  // ADMIN ONLY methods that do not fit into RPC
  // prettier-ignore
  app.get("/wireguard-config/:device", auth.onlyAdmin, routes.downloadWireguardConfig);
  // prettier-ignore
  app.get("/container-logs/:containerName", auth.onlyAdmin, routes.containerLogs);
  app.get("/file-download/:containerName", auth.onlyAdmin, routes.fileDownload);
  app.get("/download/:fileId", auth.onlyAdmin, routes.download);
  app.get("/user-action-logs", auth.onlyAdmin, routes.downloadUserActionLogs);
  app.post("/upload", auth.onlyAdmin, routes.upload);

  // Open endpoints (no auth)
  app.get("/global-envs/:name?", routes.globalEnvs);
  app.get("/public-packages/:containerName?", routes.publicPackagesData);
  app.get("/package-manifest/:dnpName", routes.packageManifest);
  app.post("/sign", routes.sign);
  app.post("/data-send", routes.dataSend);

  // Rest of RPC methods
  app.post(
    "/rpc",
    auth.onlyAdmin,
    wrapHandler(async (req, res) => res.send(await rpcHandler(req.body)))
  );

  // Default error handler must be the last
  // app.use(errorHandler);

  // Serve UI. React-router, index.html at all routes
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(params.UI_FILES_PATH, "index.html"))
  );

  server.listen(params.HTTP_API_PORT, () =>
    logs.info(`HTTP API ${params.HTTP_API_PORT}`)
  );
  return server;
}
