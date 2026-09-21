"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Gauge,
  History,
  Radio,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Radio,
    title: "Live Updates",
    description:
      "Publish an incident update once and connected clients receive it immediately through WebSockets.",
  },
  {
    icon: History,
    title: "Durable History",
    description:
      "Every update is persisted in MongoDB so the feed can recover information even after a client disconnects.",
  },
  {
    icon: RefreshCw,
    title: "Reconnect & Recover",
    description:
      "When a client reconnects, it requests everything after its last known sequence number.",
  },
  {
    icon: ShieldCheck,
    title: "Duplicate Safe",
    description:
      "Stable update IDs allow the client to safely merge history, recovery, and live updates without duplicates.",
  },
  {
    icon: Gauge,
    title: "Deterministic Ordering",
    description:
      "Every incident update receives a monotonically increasing sequence number for predictable ordering.",
  },
  {
    icon: Database,
    title: "Persistent Storage",
    description:
      "MongoDB stores the update history and sequence state separately from the temporary WebSocket connections.",
  },
];

const guarantees = [
  "Live updates without page refresh",
  "Visible connection state",
  "Recovery after disconnection",
  "Stable update identifiers",
  "Sequence-based ordering",
  "History and live data can overlap safely",
];

export default function FeaturesPage() {
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
              className="text-white"
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
            <Zap className="h-4 w-4" />
            Built for reliable real-time delivery
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Simple infrastructure.
            <br />
            <span className="text-blue-500">
              Reliable recovery.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-gray-400 sm:text-xl">
            Realtime Feed combines WebSockets, durable storage,
            sequence-based recovery, and client-side deduplication
            into a focused incident feed.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-white/10 bg-[#050505]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
              Core capabilities
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything needed for a resilient feed.
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-400">
              The system stays intentionally focused on the problems
              that matter most when delivering real-time incident
              updates.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-blue-500/[0.04]"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>

                  <h3 className="text-xl font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-base leading-7 text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reliability */}
      <section>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-500">
              Reliability first
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Real-time does not mean
              <span className="text-blue-500">
                {" "}
                fire-and-forget.
              </span>
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-400">
              A WebSocket connection is temporary. The update history
              is not. Realtime Feed separates these two concerns so a
              temporary connection failure does not automatically mean
              lost incident history.
            </p>

            <p className="mt-5 text-lg leading-8 text-gray-400">
              Clients keep track of the latest sequence they have
              received and use it as a recovery cursor after
              reconnecting.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 lg:p-9">
            <h3 className="text-xl font-semibold">
              System guarantees
            </h3>

            <div className="mt-7 space-y-5">
              {guarantees.map((guarantee) => (
                <div
                  key={guarantee}
                  className="flex items-center gap-4"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-yellow-500" />

                  <span className="text-base text-gray-300">
                    {guarantee}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Foundation */}
      <section className="border-y border-white/10 bg-[#050505]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
              Technical foundation
            </p>

            <h2 className="text-3xl font-bold sm:text-4xl">
              Small stack. Clear responsibilities.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                Transport
              </p>

              <h3 className="mt-3 text-2xl font-semibold">
                WebSocket
              </h3>

              <p className="mt-3 text-base leading-7 text-gray-400">
                Maintains the live connection between publishers and
                subscribed clients.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                Persistence
              </p>

              <h3 className="mt-3 text-2xl font-semibold">
                MongoDB
              </h3>

              <p className="mt-3 text-base leading-7 text-gray-400">
                Stores incident updates and sequence state for durable
                recovery.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                Client
              </p>

              <h3 className="mt-3 text-2xl font-semibold">
                Next.js
              </h3>

              <p className="mt-3 text-base leading-7 text-gray-400">
                Handles the feed interface, connection state, recovery,
                and duplicate-safe update merging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
          <h2 className="text-3xl font-bold sm:text-4xl">
            See the system in action.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-400">
            Open the live feed and test publishing, reconnection,
            recovery, and duplicate-safe updates.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold transition hover:bg-blue-500"
            >
              Open Live Feed
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-6 py-3 text-base font-semibold transition hover:border-white/30 hover:bg-white/5"
            >
              How It Works
            </Link>
          </div>
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
              href="/how-it-works"
              className="transition hover:text-white"
            >
              How It Works
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}