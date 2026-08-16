import { io } from "https://esm.sh/socket.io-client@4.7.5";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(); // sem URL = conecta na mesma origem que serviu a página
  }
  return socket;
}
