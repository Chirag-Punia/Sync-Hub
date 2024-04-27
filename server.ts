import express, { Request,Response,NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";
import ACTIONS from "./src/Actions.js";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5000;
const userSocketMap = {};

app.use(express.static("build"));
app.use((req:Request, res:Response, next:NextFunction) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
const getAllClients = (roomID) => {
  //return a socketid array without map fxn
  return Array.from(io.sockets.adapter.rooms.get(roomID) || []).map(
    (socketId:any) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
  socket.on(ACTIONS.JOIN, ({ roomID, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomID);
    const clients = getAllClients(roomID);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });


  socket.on(ACTIONS.CODE_CHANGE, ({ roomID, code }) => {
    socket.in(roomID).emit(ACTIONS.CODE_CHANGE, { code });
  });
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    let room = "";
    rooms.forEach((roomID) => {
      room = roomID;
      socket.in(roomID).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave(room);
  });
});

server.listen(PORT , () => {
  console.log(`Listening on PORT ${PORT}`);
});
