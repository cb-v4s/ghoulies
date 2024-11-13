// import { useDispatch, useSelector } from "react-redux";

// // types
// import { MessageT, CoordinatesT } from "../types";

// import {
//   setGridSize,
//   setUsers,
//   removeUserById,
//   addMessage,
//   selectUserId,
// } from "../state/room.reducer";
// import { useEffect } from "react";
// import { wsApiUrl } from "../siteConfig";

// export const socket = new WebSocket(wsApiUrl);

// export const updatePlayerDirection = (dest: CoordinatesT) => {
//   const data = {
//     Event: "updatePlayerDirection",
//     Data: dest,
//   };

//   socket.send(JSON.stringify(data)); //.emit("updatePlayerDirection", dest);
// };

// export const createUser = (data: {
//   roomName: string;
//   userName: string;
//   avatarId: number;
// }) => {
//   console.log("userCreation", data);
//   socket.emit("userCreation", data);
// };

// export const sendMessageTo = (message: string, socketId: string) => {
//   socket.emit("message", { message, socketId });
// };

// export const updatePlayerPosition = (data: { row: number; col: number }) =>
//   socket.emit("updatePlayerPosition", data);

// const SocketHandler = () => {
//   const dispatch = useDispatch();
//   const currentUserI = useSelector(selectUserId);

//   useEffect(() => {
//     socket.on("initMap", (data) => {
//       dispatch(setGridSize(data.gridSize));
//     });

//     socket.on("error_room_full", () => {
//       console.error("error_room_full");
//     });

//     socket.on("userDisconnected", (userId) => {
//       if (userId === currentUserI) window.location.reload();
//       dispatch(removeUserById(userId));
//     });

//     socket.on("updateMap", (data) => {
//       dispatch(setUsers(data?.players)); // ! si no metemos la lista completa de users no funciona wtf
//     });

//     socket.on("userCreated", (users) => {
//       dispatch(setUsers(users)); // ! todo: busca como arreglar luego wtf 2
//     });

//     socket.on("message", ({ message, userId }: MessageT) => {
//       dispatch(
//         addMessage({
//           userId,
//           message,
//         })
//       );
//     });

//     return () => {
//       socket.disconnect(); // * disconnect the socket connection
//       socket.off("userCreated"); // * unsubscribe from the "userCreated" event
//     };
//   }, [socket, dispatch]);

//   return null;
// };

// export default SocketHandler;
