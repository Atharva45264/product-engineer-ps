"use client";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CloudOff,
  Database,
  Radio,
  RefreshCw,
  Send,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import {
  IncidentUpdate,
  mergeUpdates,
} from "@/lib/feed-utils";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  "ws://localhost:4000";

const INCIDENT_ID = "INC-001";

type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

type ActivityEvent = {
  id: string;
  message: string;
  type: "success" | "warning" | "info";
  createdAt: Date;
};

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusLabel(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting";
    case "reconnecting":
      return "Reconnecting";
    case "disconnected":
      return "Disconnected";
  }
}

export default function Home() {
  const [updates, setUpdates] = useState<
    IncidentUpdate[]
  >([]);

  const [message, setMessage] = useState("");

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");

  const [lastSequence, setLastSequence] =
    useState(0);

  const [isRecovering, setIsRecovering] =
    useState(false);

  const [recoveryMessage, setRecoveryMessage] =
    useState<string | null>(null);

  const [activities, setActivities] = useState<
    ActivityEvent[]
  >([]);

  const socketRef =
    useRef<WebSocket | null>(null);

  const lastSequenceRef = useRef(0);

  const reconnectTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const reconnectDelayRef = useRef(2000);

  const addActivity = useCallback(
    (
      activityMessage: string,
      type: ActivityEvent["type"]
    ) => {
      const activity: ActivityEvent = {
        id: crypto.randomUUID(),
        message: activityMessage,
        type,
        createdAt: new Date(),
      };

      setActivities((current) =>
        [activity, ...current].slice(0, 8)
      );
    },
    []
  );

  const addUpdates = useCallback(
    (incoming: IncidentUpdate[]) => {
      if (incoming.length === 0) return;

      setUpdates((current) => {
        const merged = mergeUpdates(
          current,
          incoming
        );

        const latest =
          merged.length > 0
            ? merged[merged.length - 1].sequence
            : 0;

        lastSequenceRef.current = latest;
        setLastSequence(latest);

        return merged;
      });
    },
    []
  );

  const recoverUpdates = useCallback(
    async (afterSequence: number) => {
      setIsRecovering(true);

      try {
        const response = await fetch(
          `${API_URL}/api/incidents/${INCIDENT_ID}/updates?after=${afterSequence}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to recover updates"
          );
        }

        const data: {
          incidentId: string;
          after: number;
          updates: IncidentUpdate[];
        } = await response.json();

        if (data.updates.length > 0) {
          addUpdates(data.updates);

          const count = data.updates.length;

          const text =
            `Recovered ${count} missed update` +
            (count === 1 ? "" : "s");

          setRecoveryMessage(text);

          addActivity(text, "success");

          window.setTimeout(() => {
            setRecoveryMessage(null);
          }, 4000);
        }
      } catch (error) {
        console.error(
          "Failed to recover updates:",
          error
        );

        addActivity(
          "Unable to recover missed updates",
          "warning"
        );
      } finally {
        setIsRecovering(false);
      }
    },
    [addActivity, addUpdates]
  );

  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      if (!shouldReconnect) return;

      setConnectionStatus((current) =>
        current === "connected"
          ? current
          : "reconnecting"
      );

      const socket = new WebSocket(
        `${WS_URL}/ws?incidentId=${INCIDENT_ID}`
      );

      socketRef.current = socket;

      socket.onopen = async () => {
        reconnectDelayRef.current = 2000;

        setConnectionStatus("connected");

        addActivity(
          "Realtime connection established",
          "success"
        );

        await recoverUpdates(
          lastSequenceRef.current
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(
            event.data
          );

          if (data.type === "update") {
            addUpdates([data.update]);
          }

          if (data.type === "error") {
            addActivity(
              data.message ||
                "Realtime server error",
              "warning"
            );
          }
        } catch (error) {
          console.error(
            "Failed to parse WebSocket message:",
            error
          );
        }
      };

      socket.onerror = () => {
        addActivity(
          "Realtime connection error",
          "warning"
        );
      };

      socket.onclose = () => {
        socketRef.current = null;

        if (!shouldReconnect) {
          setConnectionStatus(
            "disconnected"
          );
          return;
        }

        setConnectionStatus("reconnecting");

        addActivity(
          "Connection lost. Retrying automatically...",
          "warning"
        );

        const delay =
          reconnectDelayRef.current;

        reconnectTimeoutRef.current =
          setTimeout(() => {
            reconnectDelayRef.current =
              Math.min(delay * 2, 10000);

            connect();
          }, delay);
      };
    };

    const initialize = async () => {
      await recoverUpdates(0);
      connect();
    };

    initialize();

    return () => {
      shouldReconnect = false;

      if (
        reconnectTimeoutRef.current
      ) {
        clearTimeout(
          reconnectTimeoutRef.current
        );
      }

      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [addActivity, addUpdates, recoverUpdates]);

  function handlePublish(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmed = message.trim();

    if (
      !trimmed ||
      !socketRef.current ||
      socketRef.current.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "publish",
        message: trimmed,
      })
    );

    setMessage("");
  }

  const isConnected =
    connectionStatus === "connected";

  return (
    <main
      id="top"
      className="min-h-screen bg-[#05070a] text-zinc-100"
    >
      {/* ================= NAVBAR ================= */}

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
    <Link
      href="/"
      className="flex items-center gap-3"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600">
        <Radio className="h-6 w-6" />
      </div>

      <span className="text-2xl font-bold tracking-tight">
        Pulse<span className="text-blue-500">Feed</span>
      </span>
    </Link>

    <div className="hidden items-center gap-9 text-lg text-gray-400 sm:flex">
      <Link
        href="/"
        className="transition hover:text-white"
      >
        Live Feed
      </Link>

      <Link
        href="/features"
        className="transition hover:text-white"
      >
        Features
      </Link>

      <Link
        href="/how-it-works"
        className="transition hover:text-white"
      >
        How It Works
      </Link>
    </div>

    <Link
      href="/"
      className="rounded-lg border border-white/15 px-5 py-2.5 text-base font-medium transition hover:border-blue-500 hover:bg-blue-500/10"
    >
      Open Feed
    </Link>
  </div>
</nav>

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden border-b border-blue-950/30">
        <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/[0.07] blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-8 sm:pb-28 sm:pt-32">
          <div className="mx-auto max-w-4xl text-center">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.05] px-4 py-2 text-xs font-medium text-blue-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
              Realtime incident infrastructure
            </div>

            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Reliable realtime
              <br />

              <span className="text-blue-400">
                incident updates.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-zinc-500 sm:text-lg">
              PulseFeed keeps incident teams synchronized
              through live WebSocket updates, durable
              history, deterministic ordering, and
              automatic recovery when connections drop.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#feed"
                className="group flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-[0_10px_35px_rgba(37,99,235,0.18)] transition hover:bg-blue-500 hover:shadow-[0_10px_40px_rgba(37,99,235,0.28)]"
              >
                Open Live Feed

                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </a>

              <a
                href="/features"
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-3 text-sm font-medium text-zinc-400 transition hover:border-blue-900/60 hover:text-zinc-200"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <TechBadge label="WebSocket realtime" />

              <TechBadge
                label="MongoDB persistence"
                gold
              />

              <TechBadge label="Cursor recovery" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= LIVE FEED ================= */}

      <section
        id="feed"
        className="scroll-mt-16 border-b border-blue-950/30 bg-[#06080c]"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">

          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              LIVE SYSTEM
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Incident feed
            </h2>

            <p className="mt-5 text-base leading-8 text-zinc-500 sm:text-lg">
              This is the actual realtime system. Publish
              an update and connected clients receive it
              without refreshing.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">

            {/* Feed */}
            <div className="min-w-0">

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />

                  <span className="text-lg font-semibold">
                    Payment Service
                  </span>

                  <span className="text-sm text-zinc-700">
                    {INCIDENT_ID}
                  </span>
                </div>

                <ConnectionBadge
                  status={connectionStatus}
                />
              </div>

              {recoveryMessage && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-4 py-3 text-sm text-blue-300">
                  <CheckCircle2 size={17} />
                  {recoveryMessage}
                </div>
              )}

              {isRecovering && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#d6a84f]/15 bg-[#d6a84f]/[0.04] px-4 py-3 text-sm text-[#d6a84f]">
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />

                  Synchronizing incident history...
                </div>
              )}

              <div className="space-y-3">

                {updates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#080b10] px-6 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-blue-900/40 bg-blue-500/[0.05] text-blue-500/50">
                      <CloudOff size={22} />
                    </div>

                    <h3 className="mt-5 text-base font-medium text-zinc-300">
                      No incident updates yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                      Publish an update below to see
                      the realtime feed in action.
                    </p>
                  </div>
                ) : (
                  updates.map((update) => (
                    <UpdateCard
                      key={update.id}
                      update={update}
                    />
                  ))
                )}

              </div>

              {/* Composer */}
              <form
                onSubmit={handlePublish}
                className="mt-5 rounded-2xl border border-blue-950/50 bg-[#080b10] p-4 shadow-[0_15px_50px_rgba(0,0,0,0.25)]"
              >
                <label
                  htmlFor="message"
                  className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-zinc-600"
                >
                  Publish incident update
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    id="message"
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();

                        if (
                          message.trim() &&
                          isConnected
                        ) {
                          event.currentTarget.form?.requestSubmit();
                        }
                      }
                    }}
                    disabled={!isConnected}
                    rows={2}
                    placeholder={
                      isConnected
                        ? "Describe the latest incident update..."
                        : "Waiting for connection..."
                    }
                    className="min-h-[78px] flex-1 resize-none rounded-xl border border-zinc-800 bg-[#05070a] px-4 py-3 text-base text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={
                      !isConnected ||
                      !message.trim()
                    }
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600 sm:self-end"
                  >
                    <Send size={16} />
                    Publish
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-zinc-700">
                  <span>
                    Enter to publish · Shift + Enter
                  </span>

                  <span>
                    Cursor #{lastSequence}
                  </span>
                </div>
              </form>
            </div>

            {/* Status */}
            <aside className="space-y-4">

              <div className="rounded-2xl border border-zinc-800/80 bg-[#080b10] p-5">
                <div className="mb-5 flex items-center gap-2">
                  <Zap
                    size={17}
                    className="text-[#d6a84f]"
                  />

                  <h3 className="text-base font-semibold">
                    System status
                  </h3>
                </div>

                <div className="space-y-4">
                  <StatusRow
                    label="Connection"
                    value={getStatusLabel(
                      connectionStatus
                    )}
                    dot={
                      isConnected
                        ? "blue"
                        : "gold"
                    }
                  />

                  <StatusRow
                    label="Incident"
                    value={INCIDENT_ID}
                  />

                  <StatusRow
                    label="Last sequence"
                    value={`#${lastSequence}`}
                    gold
                  />

                  <StatusRow
                    label="Updates loaded"
                    value={String(
                      updates.length
                    )}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-[#080b10] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3
                    size={16}
                    className="text-blue-400"
                  />

                  <h3 className="text-base font-semibold">
                    Connection activity
                  </h3>
                </div>

                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-zinc-700">
                      Waiting for connection events...
                    </p>
                  ) : (
                    activities
                      .slice(0, 5)
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-3"
                        >
                          <span
                            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                              activity.type ===
                              "warning"
                                ? "bg-[#d6a84f]"
                                : "bg-blue-400"
                            }`}
                          />

                          <div className="min-w-0">
                            <p className="text-sm leading-6 text-zinc-500">
                              {activity.message}
                            </p>

                            <span className="text-xs text-zinc-700">
                              {activity.createdAt.toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </aside>
          </div>
        </div>
      </section>

      {/* ================= SMALL INTRO TO FEATURES ================= */}

      <section className="border-b border-blue-950/30 bg-[#05070a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-20 sm:px-8 md:flex-row md:items-center md:justify-between sm:py-24">

          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d6a84f]">
              Built for reliability
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Realtime delivery is only half the problem.
            </h2>

            <p className="mt-5 text-base leading-8 text-zinc-500">
              PulseFeed combines live delivery with durable
              history, sequence-based recovery, and duplicate
              protection so temporary connection failures
              don't mean losing incident updates.
            </p>
          </div>

          <a
            href="/features"
            className="group flex w-fit shrink-0 items-center gap-2 rounded-xl border border-blue-900/50 bg-blue-500/[0.04] px-5 py-3 text-sm font-medium text-blue-400 transition hover:border-blue-500/30 hover:bg-blue-500/[0.07]"
          >
            Explore features

            <ArrowRight
              size={16}
              className="transition group-hover:translate-x-1"
            />
          </a>

        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-blue-950/30 bg-[#05070a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">

          <div className="flex items-center gap-2 font-medium text-zinc-500">
            <Activity
              size={15}
              className="text-blue-400"
            />

            PulseFeed
          </div>

          <div className="text-zinc-700">
            Reconnecting realtime incident feed
          </div>

          <a
            href="/how-it-works"
            className="text-zinc-600 transition hover:text-blue-400"
          >
            How it works →
          </a>

        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function TechBadge({
  label,
  gold = false,
}: {
  label: string;
  gold?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
        gold
          ? "border-[#d6a84f]/15 bg-[#d6a84f]/[0.04] text-[#b99449]"
          : "border-blue-900/50 bg-blue-500/[0.03] text-zinc-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          gold
            ? "bg-[#d6a84f]"
            : "bg-blue-400"
        }`}
      />

      {label}
    </div>
  );
}

function ConnectionBadge({
  status,
}: {
  status: ConnectionStatus;
}) {
  const connected =
    status === "connected";

  const disconnected =
    status === "disconnected";

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
        connected
          ? "border-blue-500/20 bg-blue-500/[0.05] text-blue-400"
          : disconnected
            ? "border-red-500/20 bg-red-500/[0.05] text-red-400"
            : "border-[#d6a84f]/20 bg-[#d6a84f]/[0.05] text-[#d6a84f]"
      }`}
    >
      {connected ? (
        <Wifi size={14} />
      ) : disconnected ? (
        <WifiOff size={14} />
      ) : (
        <RefreshCw
          size={14}
          className="animate-spin"
        />
      )}

      {getStatusLabel(status)}

      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected
            ? "bg-blue-400 shadow-[0_0_7px_rgba(59,130,246,0.8)]"
            : disconnected
              ? "bg-red-400"
              : "bg-[#d6a84f]"
        }`}
      />
    </div>
  );
}

function StatusRow({
  label,
  value,
  dot,
  gold = false,
}: {
  label: string;
  value: string;
  dot?: "blue" | "gold";
  gold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-600">
        {label}
      </span>

      <div className="flex items-center gap-2">
        {dot && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              dot === "gold"
                ? "bg-[#d6a84f]"
                : "bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.7)]"
            }`}
          />
        )}

        <span
          className={
            gold
              ? "text-sm text-[#b99449]"
              : "text-sm text-zinc-300"
          }
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function UpdateCard({
  update,
}: {
  update: IncidentUpdate;
}) {
  return (
    <article className="group rounded-2xl border border-zinc-800/80 bg-[#080b10] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-blue-900/60 hover:bg-[#090d13] sm:p-6">
      <div className="flex gap-4">

        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/15 bg-blue-500/[0.06] text-blue-400 transition group-hover:border-blue-400/30 group-hover:bg-blue-500/10">
            <Activity size={17} />
          </div>

          <div className="mt-2 h-full w-px bg-gradient-to-b from-blue-900/40 to-transparent" />
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">

              <span className="rounded-md border border-[#d6a84f]/10 bg-[#d6a84f]/[0.04] px-2 py-1 font-mono text-xs text-[#b99449]">
                SEQ {update.sequence}
              </span>

              <span className="h-1 w-1 rounded-full bg-zinc-800" />

              <span className="text-xs text-zinc-600">
                {formatTime(
                  update.createdAt
                )}
              </span>

            </div>

            <span className="text-xs text-zinc-700">
              {formatDate(
                update.createdAt
              )}
            </span>
          </div>

          <p className="mt-4 text-base leading-7 text-zinc-200">
            {update.message}
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-700">
            <CheckCircle2
              size={13}
              className="text-blue-500/60"
            />

            Persisted update
          </div>

        </div>
      </div>
    </article>
  );
}