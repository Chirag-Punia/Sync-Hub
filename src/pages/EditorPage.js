import React, { useEffect, useState, useRef } from "react";
import "./styles/EditorPage.css";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";

const EditorPage = () => {
  {
    const socketRef = useRef(null);
    const [language, setLanguage] = useState(54);
    const [inp, setInp] = useState();
    const location = useLocation();
    const codeRef = useRef(null);
    const reactNavigator = useNavigate();
    const { roomID } = useParams();
    const [clients, setClients] = useState([]);
    async function handleCompileAndOpenNewWindow() {
      const outputData = await Submit();
      const newWindow = window.open("", "_blank");

      if (newWindow) {
        console.log(outputData);
        newWindow.onload = () => {
          newWindow.document.write(`<html>
          <head>
              <title>Compilation Output</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      padding: 20px;
                      background-color: black;
                  }
                  h1 {
                      color: white;
                  }
                  p {
                      color: white;
                  }

              </style>
          </head>
          <body>
              <h1>Compilation Output:</h1>
              <p>${outputData}</p>
          </body>
      </html>
  `);
        };
      } else {
        toast.error("Failed to open new window");
      }
    }

    const handleError = (err) => {
      console.log(err);
      toast.error("Socket connection failed , Try again later");
      reactNavigator("/");
      return;
    };
    useEffect(() => {
      const init = async () => {
        socketRef.current = await initSocket();
        socketRef.current.on("connect_error", (err) => {
          handleError(err);
        });
        socketRef.current.on("connect_failed", (err) => {
          handleError(err);
        });
        socketRef.current.emit(ACTIONS.JOIN, {
          roomID: roomID,
          username: location.state.username,
        });

        socketRef.current.on(
          ACTIONS.JOINED,
          ({ clients, username, socketId }) => {
            if (username !== location.state.username) {
              toast.success(`${username} joined the room.`);
            }
            setClients(clients);
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              code: codeRef.current,
              socketId,
            });
          }
        );

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast.success(`${username} left the room.`);
          console.log(clients);
          setClients((prev) => {
            return prev.filter((client) => client.socketId !== socketId);
          });
        });
      };
      init();
      return () => {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOIN);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      };
    }, []);
    function leaveRoom() {
      reactNavigator("/");
    }

    async function copyRoomId() {
      try {
        await navigator.clipboard.writeText(roomID);
        toast.success("Room ID has been copied to your clipboard");
      } catch (err) {
        toast.error("Could not copy the Room ID");
        console.error(err);
      }
    }

    async function Submit() {
      if (codeRef.current !== null) {
        const response = await fetch(
          "https://judge0-ce.p.rapidapi.com/submissions",
          {
            method: "POST",
            headers: {
              "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
              "x-rapidapi-key":
                "3d687c483fmshb84247eddfd7901p1cd102jsn60fa170af603",
              "content-type": "application/json",
              accept: "application/json",
            },
            body: JSON.stringify({
              source_code: codeRef.current,
              stdin: inp,
              language_id: language,
            }),
          }
        );

        const jsonResponse = await response.json();
        let jsonGetSolution = {
          status: { description: "Queue" },
          stderr: null,
          compile_output: null,
        };
        while (
          jsonGetSolution.status.description !== "Accepted" &&
          jsonGetSolution.stderr == null &&
          jsonGetSolution.compile_output == null
        ) {
          if (jsonResponse.token) {
            let url = `https://judge0-ce.p.rapidapi.com/submissions/${jsonResponse.token}?base64_encoded=true`;
            const getSolution = await fetch(url, {
              method: "GET",
              headers: {
                "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                "x-rapidapi-key":
                  "3d687c483fmshb84247eddfd7901p1cd102jsn60fa170af603",
                "content-type": "application/json",
              },
            });
            jsonGetSolution = await getSolution.json();
          }
        }
        console.log(jsonGetSolution);
        if (jsonGetSolution.status.description === "Accepted") {
          return atob(jsonGetSolution.stdout);
        } else {
          return jsonGetSolution.status.description;
        }
      }
    }

    return (
      <>
        <div className="mainWrap">
          <div className="aside">
            <div className="asideInner">
              <div className="logo">
                <img className="logoImage" src="/logo.png" alt="editorlogo" />
              </div>
              <h3>Connected</h3>
              <div className="clientList">
                {clients.map((c) => (
                  <Client key={c.socketId} props={c.username} />
                ))}
              </div>
            </div>
            <button className="btn copyBtn" onClick={copyRoomId}>
              Copy Room ID
            </button>
            <button className="btn leaveBtn" onClick={leaveRoom}>
              Leave
            </button>
          </div>
          <div className="editorWrap">
            <div className="temp">
              <div className="custom-select ">
                <select
                  id="tags"
                  onChange={(e) => {
                    setLanguage(e.target.value);
                  }}
                >
                  <option value="54" selected="selected">C++</option>
                  <option value="50">C</option>
                  <option value="71">Python</option>
                </select>
              </div>
              <button
                className="btn compile-btn"
                onClick={handleCompileAndOpenNewWindow}
              >
                Compile
              </button>
            </div>

            <Editor
              socketRef={socketRef}
              roomID={roomID}
              onCodeChange={(code) => {
                codeRef.current = code;
              }}
            />
          </div>
          <div className="outputWrap"></div>
          <input
            className="stdinput"
            placeholder="std:input"
            onChange={(e) => {
              setInp(e.target.value);
            }}
          />
        </div>
      </>
    );
  }
};

export default EditorPage;
