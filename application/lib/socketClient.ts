"use client"
import {io} from "socket.io-client"
const hostname = process.env.HOSTNAME ||"localhost";
const port = parseInt(process.env.PORT||"3000",10)
export const socket = io(`http://${hostname}:${port}`, {
  transports: ["websocket"], 
});
