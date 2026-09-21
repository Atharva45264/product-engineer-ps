import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "node:http";
import { createUpdate } from "../services/update-service";
import { IncidentUpdate } from "../models/update";

type ClientMessage = {
  type: "publish";
  message: string;
};

const clientsByIncident = new Map<string, Set<WebSocket>>();

function addClient(
  incidentId: string,
  socket: WebSocket
): void {
  let clients = clientsByIncident.get(incidentId);

  if (!clients) {
    clients = new Set<WebSocket>();
    clientsByIncident.set(incidentId, clients);
  }

  clients.add(socket);
}

function removeClient(
  incidentId: string,
  socket: WebSocket
): void {
  const clients = clientsByIncident.get(incidentId);

  if (!clients) {
    return;
  }

  clients.delete(socket);

  if (clients.size === 0) {
    clientsByIncident.delete(incidentId);
  }
}

export function broadcastUpdate(
  update: IncidentUpdate
): void {
  const clients = clientsByIncident.get(update.incidentId);

  if (!clients) {
    return;
  }

  const payload = JSON.stringify({
    type: "update",
    update,
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function sendError(
  socket: WebSocket,
  message: string
): void {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "error",
      message,
    })
  );
}

function parseClientMessage(
  rawMessage: Buffer
): ClientMessage | null {
  try {
    const parsed = JSON.parse(rawMessage.toString());

    if (
      parsed?.type !== "publish" ||
      typeof parsed.message !== "string" ||
      parsed.message.trim().length === 0
    ) {
      return null;
    }

    return {
      type: "publish",
      message: parsed.message.trim(),
    };
  } catch {
    return null;
  }
}

export function setupWebSocketServer(
  server: Server
): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  wss.on("connection", (socket, request: IncomingMessage) => {
    const url = new URL(
      request.url ?? "",
      "http://localhost"
    );

    const incidentId = url.searchParams.get("incidentId");

    if (!incidentId) {
      sendError(socket, "incidentId is required");
      socket.close(1008, "incidentId is required");
      return;
    }

    addClient(incidentId, socket);

    console.log(
      `WebSocket client connected to incident ${incidentId}`
    );

    socket.send(
      JSON.stringify({
        type: "connected",
        incidentId,
      })
    );

    socket.on("message", async (rawMessage: Buffer) => {
      const message = parseClientMessage(rawMessage);

      if (!message) {
        sendError(
          socket,
          "Invalid message. Expected { type: 'publish', message: string }"
        );
        return;
      }

      try {
        const update = await createUpdate(
          incidentId,
          message.message
        );

        broadcastUpdate(update);
      } catch (error) {
        console.error(
          "Failed to create WebSocket update:",
          error
        );

        sendError(
          socket,
          "Failed to create incident update"
        );
      }
    });

    socket.on("close", () => {
      removeClient(incidentId, socket);

      console.log(
        `WebSocket client disconnected from incident ${incidentId}`
      );
    });

    socket.on("error", (error) => {
      console.error(
        `WebSocket error for incident ${incidentId}:`,
        error
      );
    });
  });

  console.log("WebSocket server available at /ws");

  return wss;
}