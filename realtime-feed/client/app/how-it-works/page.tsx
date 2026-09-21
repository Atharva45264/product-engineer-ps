"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Database,
  GitBranch,
  History,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Wifi,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Database,
    title: "History is persisted",
    description:
      "When an incident update is created, it is stored in MongoDB together with a stable ID and an incident-specific sequence number.",
  },
  {
    number: "02",
    icon: Wifi,
    title: "Clients connect",
    description:
      "A client opens a WebSocket connection for a specific incident and receives a visible connected state.",
  },
  {
    number: "03",
    icon: Radio,
    title: "Updates are delivered live",
    description:
      "When a connected client publishes an update, the server persists it and broadcasts the resulting update to clients connected to that incident.",
  },
  {
    number: "04",
    icon: RefreshCw,
    title: "Connection can recover",
    description:
      "If the WebSocket connection drops, the client enters a reconnecting state and attempts to establish the connection again.",
  },
  {
    number: "05",
    icon: History,
    title: "Missed updates are replayed",
    description:
      "After reconnecting, the client asks for updates after its last known sequence number. The server returns the missing durable history in order.",
  },
  {
    number: "06",
    icon: ShieldCheck,
    title: "Overlapping data is deduplicated",
    description:
      "Recovery and live delivery can overlap. Stable update IDs let the client merge both paths without showing the same update twice.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
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
              Realtime<span className="text-blue-500">Feed</span>
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
              className="text-white"
            >
              How It Works
            </Link>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium transition hover:border-blue-500 hover:bg-blue-500/10"
          >
            Open Feed
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center lg:px-8 lg:pt-32">
          <div className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            <GitBranch className="h-4 w-4" />
            Architecture & recovery flow
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            How the feed
            <br />
            <span className="text-blue-500">
              stays in sync.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-gray-400 sm:text-xl">
            The important distinction is simple: WebSockets handle
            delivery, while MongoDB provides the durable history used
            for recovery.
          </p>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="border-y border-white/10 bg-[#050505]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
              Architecture
            </p>

            <h2 className="text-3xl font-bold sm:text-4xl">
              Three pieces, one recovery model.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Server className="h-6 w-6 text-blue-400" />
              </div>

              <h3 className="mt-6 text-2xl font-semibold">
                Server
              </h3>

              <p className="mt-4 text-base leading-7 text-gray-400">
                Accepts WebSocket connections, validates incoming
                messages, creates updates, and broadcasts them to
                subscribers of the same incident.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Database className="h-6 w-6 text-blue-400" />
              </div>

              <h3 className="mt-6 text-2xl font-semibold">
                MongoDB
              </h3>

              <p className="mt-4 text-base leading-7 text-gray-400">
                Stores durable updates and maintains the sequence
                counter used to identify where a client is in the
                incident history.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Wifi className="h-6 w-6 text-blue-400" />
              </div>

              <h3 className="mt-6 text-2xl font-semibold">
                Client
              </h3>

              <p className="mt-4 text-base leading-7 text-gray-400">
                Displays connection state, receives live updates,
                remembers the latest sequence, reconnects, and merges
                recovered history safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
              The complete flow
            </p>

            <h2 className="text-3xl font-bold sm:text-4xl">
              From publish to recovery.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-400">
              Each step has one responsibility, making the system
              easier to reason about and test.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-6 hidden h-[calc(100%-48px)] w-px bg-gradient-to-b from-blue-500/60 via-blue-500/20 to-transparent sm:block" />

            <div className="space-y-6">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.number}
                    className="relative flex gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-blue-500/30 hover:bg-blue-500/[0.03] sm:p-8"
                  >
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-black">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold tracking-widest text-yellow-500">
                          {step.number}
                        </span>

                        <h3 className="text-xl font-semibold sm:text-2xl">
                          {step.title}
                        </h3>
                      </div>

                      <p className="mt-3 text-base leading-7 text-gray-400 sm:text-lg">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Recovery Example */}
      <section className="border-y border-white/10 bg-[#050505]">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
              Recovery example
            </p>

            <h2 className="text-3xl font-bold sm:text-4xl">
              What happens when a client disconnects?
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold text-gray-400">
              <span>Sequence</span>
              <span>Client state</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-white/10">
              <div className="grid grid-cols-3 gap-4 px-6 py-6">
                <span className="font-mono text-blue-400">
                  1 → 5
                </span>

                <span className="text-gray-300">
                  Connected
                </span>

                <span className="text-gray-400">
                  Client receives live updates.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 px-6 py-6">
                <span className="font-mono text-yellow-500">
                  6 → 8
                </span>

                <span className="text-gray-300">
                  Disconnected
                </span>

                <span className="text-gray-400">
                  Updates continue to be persisted.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 px-6 py-6">
                <span className="font-mono text-blue-400">
                  after = 5
                </span>

                <span className="text-gray-300">
                  Reconnecting
                </span>

                <span className="text-gray-400">
                  Client requests updates after sequence 5.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 px-6 py-6">
                <span className="font-mono text-blue-400">
                  6, 7, 8
                </span>

                <span className="text-gray-300">
                  Recovered
                </span>

                <span className="text-gray-400">
                  Missing updates are replayed in order.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ordering + Dedup */}
      <section>
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 lg:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <CircleDot className="h-6 w-6 text-blue-400" />
            </div>

            <h3 className="mt-6 text-2xl font-semibold">
              Deterministic ordering
            </h3>

            <p className="mt-4 text-base leading-7 text-gray-400">
              Every incident has its own sequence counter. New updates
              receive the next sequence number, and recovery queries
              request everything with a greater sequence.
            </p>

            <div className="mt-7 rounded-xl border border-white/10 bg-black p-5 font-mono text-sm">
              <div className="text-gray-500">
                Incident: INC-001
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-yellow-500">
                    #1
                  </span>{" "}
                  Database latency
                </div>

                <div>
                  <span className="text-yellow-500">
                    #2
                  </span>{" "}
                  API errors increasing
                </div>

                <div>
                  <span className="text-yellow-500">
                    #3
                  </span>{" "}
                  Service recovered
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 lg:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
            </div>

            <h3 className="mt-6 text-2xl font-semibold">
              Duplicate-safe merging
            </h3>

            <p className="mt-4 text-base leading-7 text-gray-400">
              A recovered update may arrive close to a live update.
              Instead of trusting the delivery path, the client uses
              the update ID as the deduplication key.
            </p>

            <div className="mt-7 rounded-xl border border-white/10 bg-black p-5 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  History
                </span>

                <span className="text-gray-300">
                  update-42
                </span>
              </div>

              <div className="my-3 h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  Live
                </span>

                <span className="text-gray-300">
                  update-42
                </span>
              </div>

              <div className="my-3 h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  Result
                </span>

                <span className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  One update
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testing */}
      <section className="border-y border-white/10 bg-[#050505]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8 lg:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
            Designed to be tested
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl">
            The important failure path is observable.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-gray-400">
            The project focuses its tests on the behavior that matters:
            live delivery, sequence-based replay, and duplicate-safe
            merging across overlapping delivery paths.
          </p>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-5">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />

              <p className="mt-3 font-medium">
                Live delivery
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-5">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />

              <p className="mt-3 font-medium">
                Cursor replay
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-5">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />

              <p className="mt-3 font-medium">
                Deduplication
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to test it?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-400">
            Open the feed, connect multiple clients, publish an update,
            and observe the recovery behavior.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold transition hover:bg-blue-500"
          >
            Open Live Feed
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            Realtime Feed — Reconnecting Real-Time Feed
          </p>

          <div className="flex gap-6">
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
          </div>
        </div>
      </footer>
    </main>
  );
}