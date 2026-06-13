

const { createServer } = require("http");


const next = require("next");


const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/api/socketio",
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  global.io = io;

  io.on("connection", (socket) => {
    const uid = socket.handshake.query.uid;
    if (uid) {
      socket.join(`user:${uid}`);
    }

    socket.on("identify", ({ uid }) => {
      if (uid) {
        socket.join(`user:${uid}`);
      }
    });

    socket.on("join:product", ({ productId }) => {
      socket.join(`product:${productId}`);
    });

    socket.on("leave:product", ({ productId }) => {
      socket.leave(`product:${productId}`);
    });

    socket.on("join:chat", ({ shopId, userId }) => {
      const room = `chat:${shopId}:${userId}`;
      socket.join(room);
    });

    socket.on("leave:chat", ({ shopId, userId }) => {
      socket.leave(`chat:${shopId}:${userId}`);
    });

    socket.on("disconnect", () => {
      

    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Nashwa server ready at http://localhost:${port} [${dev ? "development" : "production"}]`
    );
  });
});
