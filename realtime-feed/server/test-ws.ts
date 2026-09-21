import WebSocket from "ws";

const clientName = process.argv[2] || "Client";
const incidentId = process.argv[3] || "INC-001";

const socket = new WebSocket(
  `ws://localhost:4000/ws?incidentId=${incidentId}`
);

socket.on("open", () => {
  console.log(`${clientName} connected`);
});

socket.on("message", (data) => {
  try {
    const message = JSON.parse(data.toString());

    console.log(
      `${clientName} received:`,
      JSON.stringify(message, null, 2)
    );
  } catch {
    console.log(`${clientName} received:`, data.toString());
  }
});

socket.on("close", () => {
  console.log(`${clientName} disconnected`);
});

socket.on("error", (error) => {
  console.error(`${clientName} error:`, error.message);
});