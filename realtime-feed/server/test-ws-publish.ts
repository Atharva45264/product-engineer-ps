import WebSocket from "ws";

const incidentId = process.argv[2] || "INC-001";
const message =
  process.argv[3] || "Test real-time incident update";

const socket = new WebSocket(
  `ws://localhost:4000/ws?incidentId=${incidentId}`
);

socket.on("open", () => {
  console.log("Publisher connected");

  socket.send(
    JSON.stringify({
      type: "publish",
      message,
    })
  );

  console.log(`Published: ${message}`);
});

socket.on("message", (data) => {
  try {
    const response = JSON.parse(data.toString());

    console.log(
      "Publisher received:",
      JSON.stringify(response, null, 2)
    );
  } catch {
    console.log(
      "Publisher received:",
      data.toString()
    );
  }

  setTimeout(() => {
    socket.close();
  }, 500);
});

socket.on("close", () => {
  console.log("Publisher disconnected");
});

socket.on("error", (error) => {
  console.error("Publisher error:", error.message);
});