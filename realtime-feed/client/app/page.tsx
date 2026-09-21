"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  IncidentUpdate,
  mergeUpdates,
} from "../lib/feed-utils";

type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

const INCIDENT_ID = "INC-001";

export default function Home() {
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] =
    useState<ConnectionStatus>("connecting");
  const [lastSequence, setLastSequence] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);

  // Always contains the latest sequence number.
  // This is important inside asynchronous WebSocket callbacks.
  const lastSequenceRef = useRef(0);

function addUpdate(update: IncidentUpdate) {
  setUpdates((current) =>
    mergeUpdates(current, [update])
  );

  if (update.sequence > lastSequenceRef.current) {
    lastSequenceRef.current = update.sequence;
    setLastSequence(update.sequence);
  }
}

  async function recoverUpdates(
    afterSequence: number
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${INCIDENT_ID}/updates?after=${afterSequence}`
      );

      if (!response.ok) {
        throw new Error(
          `Recovery request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      for (const update of data.updates as IncidentUpdate[]) {
        addUpdate(update);
      }

      console.log(
        `Recovery completed after sequence ${afterSequence}. ` +
          `Received ${data.updates.length} update(s).`
      );
    } catch (error) {
      console.error(
        "Failed to recover incident updates:",
        error
      );
    }
  }

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null =
      null;

    let shouldReconnect = true;

    async function connect() {
      if (!shouldReconnect) {
        return;
      }

      setStatus((current) =>
        current === "connected"
          ? "reconnecting"
          : "connecting"
      );

      const socket = new WebSocket(
        `${WS_URL}/ws?incidentId=${INCIDENT_ID}`
      );

      socketRef.current = socket;

      socket.onopen = async () => {
        if (!shouldReconnect) {
          socket.close();
          return;
        }

        console.log("WebSocket connected");

        setStatus("connected");

        // Capture the latest known cursor when this
        // WebSocket connection becomes active.
        const recoveryCursor =
          lastSequenceRef.current;

        // Recover anything that may have been missed
        // while disconnected.
        await recoverUpdates(recoveryCursor);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "update" && data.update) {
            addUpdate(data.update);
          }
        } catch (error) {
          console.error(
            "Failed to parse WebSocket message:",
            error
          );
        }
      };

      socket.onerror = () => {
        if (shouldReconnect) {
          console.error("WebSocket connection error");
        }
      };

      socket.onclose = (event) => {
        console.log("WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        if (!shouldReconnect) {
          return;
        }

        setStatus("reconnecting");

        reconnectTimer = setTimeout(() => {
          connect();
        }, 2000);
      };
    }

    async function initialize() {
      // First load all durable history.
      // This establishes the correct initial cursor.
      await recoverUpdates(0);

      if (shouldReconnect) {
        await connect();
      }
    }

    initialize();

    return () => {
      shouldReconnect = false;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      setStatus("disconnected");
    };
  }, []);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      console.warn(
        "Cannot publish while WebSocket is disconnected"
      );
      return;
    }

    socket.send(
      JSON.stringify({
        type: "publish",
        message: trimmedMessage,
      })
    );

    setMessage("");
  }

  const statusLabel = {
    connecting: "Connecting",
    connected: "Connected",
    reconnecting: "Reconnecting",
    disconnected: "Disconnected",
  }[status];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Real-Time Incident Feed
              </p>

              <h1 className="text-3xl font-semibold">
                Incident {INCIDENT_ID}
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  status === "connected"
                    ? "bg-green-400"
                    : status === "reconnecting"
                      ? "bg-yellow-400"
                      : "bg-red-400"
                }`}
              />

              <span>{statusLabel}</span>
            </div>
          </div>

          <div className="text-sm text-slate-400">
            Last received sequence:{" "}
            <span className="font-medium text-white">
              {lastSequence}
            </span>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mb-8 flex gap-3"
        >
          <input
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Publish an incident update..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-slate-500"
          />

          <button
            type="submit"
            disabled={
              status !== "connected" ||
              message.trim().length === 0
            }
            className="rounded-lg bg-white px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publish
          </button>
        </form>
        <section className="space-y-3">
          {updates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-slate-500">
              No incident updates yet.
            </div>
          ) : (
            updates.map((update) => (
              <article
                key={update.id}
                className="rounded-lg border border-slate-800 bg-slate-900 p-5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                    Sequence {update.sequence}
                  </span>

                  <time className="text-xs text-slate-500">
                    {new Date(
                      update.createdAt
                    ).toLocaleTimeString()}
                  </time>
                </div>

                <p className="text-slate-100">
                  {update.message}
                </p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}