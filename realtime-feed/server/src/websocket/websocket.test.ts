import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { createServer, Server } from "node:http";
import WebSocket from "ws";

const { getNextSequenceMock, saveUpdateMock } =
  vi.hoisted(() => ({
    getNextSequenceMock: vi.fn(),
    saveUpdateMock: vi.fn(),
  }));

vi.mock("../services/sequence-service", () => ({
  getNextSequence: getNextSequenceMock,
}));

vi.mock("../services/update-repository", () => ({
  saveUpdate: saveUpdateMock,
}));

import { setupWebSocketServer } from "./websocket";

function waitForOpen(
  socket: WebSocket
): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
}

function waitForMessage(
  socket: WebSocket
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    socket.once("message", (data) => {
      try {
        resolve(JSON.parse(data.toString()));
      } catch (error) {
        reject(error);
      }
    });

    socket.once("error", reject);
  });
}

describe("WebSocket live updates", () => {
  let httpServer: Server | undefined;
  let clientA: WebSocket | undefined;
  let clientB: WebSocket | undefined;

  afterEach(async () => {
    clientA?.close();
    clientB?.close();

    await new Promise<void>((resolve) => {
      if (!httpServer) {
        resolve();
        return;
      }

      httpServer.close(() => resolve());
    });

    vi.clearAllMocks();

    httpServer = undefined;
    clientA = undefined;
    clientB = undefined;
  });

  it("broadcasts a published update to connected clients", async () => {
    getNextSequenceMock.mockResolvedValue(1);
    saveUpdateMock.mockResolvedValue(undefined);

    httpServer = createServer();

    setupWebSocketServer(httpServer);

    await new Promise<void>((resolve) => {
      httpServer!.listen(
        0,
        "127.0.0.1",
        () => resolve()
      );
    });

    const address = httpServer.address();

    if (!address || typeof address === "string") {
      throw new Error(
        "Failed to determine test server port"
      );
    }

    const url =
      `ws://127.0.0.1:${address.port}` +
      `/ws?incidentId=INC-001`;

    clientA = new WebSocket(url);
    clientB = new WebSocket(url);

    // Register message listeners immediately.
    const connectedMessageA =
      waitForMessage(clientA);

    const connectedMessageB =
      waitForMessage(clientB);

    // Then wait for both connections.
    await Promise.all([
      waitForOpen(clientA),
      waitForOpen(clientB),
    ]);

    // Verify both clients received the connection message.
    const [connectionA, connectionB] =
      await Promise.all([
        connectedMessageA,
        connectedMessageB,
      ]);

    expect(connectionA).toEqual({
      type: "connected",
      incidentId: "INC-001",
    });

    expect(connectionB).toEqual({
      type: "connected",
      incidentId: "INC-001",
    });

    // Start listening before publishing.
    const receivedByB =
      waitForMessage(clientB);

    clientA.send(
      JSON.stringify({
        type: "publish",
        message:
          "Payment service latency increased",
      })
    );

    const message = (await receivedByB) as {
      type: string;
      update: {
        id: string;
        incidentId: string;
        message: string;
        sequence: number;
        createdAt: string;
      };
    };

    expect(getNextSequenceMock).toHaveBeenCalledWith(
      "INC-001"
    );

    expect(saveUpdateMock).toHaveBeenCalledTimes(1);

    expect(message.type).toBe("update");

    expect(message.update.incidentId).toBe(
      "INC-001"
    );

    expect(message.update.message).toBe(
      "Payment service latency increased"
    );

    expect(message.update.sequence).toBe(1);

    expect(message.update.id).toBeTypeOf(
      "string"
    );
  });
});