import { Server } from "socket.io";

let io;

export default {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: '*',
      }
    })
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket io does not exist')
    } else {
      return io
    }
  }
}