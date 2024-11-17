import "./styles.css";

export const Chatbox = () => {
  const positionList = [
    "right-[200px]",
    "right-[150px]",
    "right-[100px]",
    "right-[50px]",
    "right-[0px]",
    "right-[-100px]",
    "right-[-150px]",
    "right-[-200px]",
  ];

  const messages = [
    {
      userName: "Alice",
      message: "Hello world!",
      // hay que almacenar la posicion en messages (state) para que al e.g. abrir
      // la consola no se vuelva a tomar una posicion aleatoria
      position: positionList[Math.floor(Math.random() * positionList.length)],
    },
  ];

  return (
    <div className="absolute top-0 left-0 w-full h-40 bg-sky-800">
      {messages.length &&
        messages.map(({ userName, message, position }) => (
          <div
            id="message"
            className={`w-8/12 h-6 flex rounded-lg bg-transparent select-none absolute bottom-0 ${position}`}
          >
            <div className="w-[8%] bg-sky-300 bg-contain bg-no-repeat bg-center bg-[url('/sprites/lgosty.png')] h-full text-white flex justify-center items-center rounded-l-lg">
              a
            </div>
            <div className="w-auto max-w-[92%] h-100 bg-white text-black pl-2 pr-4 rounded-r-lg text-sm flex items-center">
              <span className="mr-2 font-bold text-slate-800">{userName}:</span>
              <span>{message}</span>
            </div>
          </div>
        ))}
    </div>
  );
};
