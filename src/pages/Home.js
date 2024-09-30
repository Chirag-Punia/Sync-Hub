import React, { useState } from "react";
import "./styles/Home.css";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners"; // Importing the spinner

const Home = () => {
  const navigate = useNavigate();
  const [roomID, setroomID] = useState("");
  const [username, setUserName] = useState("");
  const [loading, setLoading] = useState(false); // New loading state

  const handleEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setroomID(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!roomID || !username) {
      toast.error("Room ID and Username are required");
      return;
    }

    setLoading(true); // Set loading to true
    setTimeout(() => {
      navigate(`/editor/${roomID}`, {
        state: {
          username,
        },
      });
      setLoading(false); // Set loading to false after navigation
    }, 1000); // Simulating a delay for the spinner to show up
  };

  return (
    <div className="homepageWrapper">
      <div className="formWrapper">
        <img src="./logo.png" alt="logo" />
        <h4 className="mainLabel">Paste Invitation Room ID</h4>
        <div className="inputGroup">
          <input
            type="text"
            className="inputBox"
            placeholder="ROOM ID"
            onChange={(e) => {
              setroomID(e.target.value);
            }}
            value={roomID}
            onKeyUp={handleEnter}
          />
          <input
            type="text"
            className="inputBox"
            placeholder="USERNAME"
            onKeyUp={handleEnter}
            value={username}
            onChange={(e) => {
              setUserName(e.target.value);
            }}
          />
 
          {}
          {loading ? (
            <div className="spinner">
              <ClipLoader color={"#37B5B6"} loading={loading} size={30} />
            </div>
          ) : (
            <button className="btn joinBtn" onClick={joinRoom}>
              JOIN
            </button>
          )}

          <span className="createInfo">
            if you don't have an invite then create &nbsp;
            <a onClick={createNewRoom} href="" className="createNewBtn">
              new room
            </a>
          </span>
        </div>
      </div>
      <footer>
        <h4>
          Made with ❤️ By{" "}
          <a
            href="https://github.com/Chirag-Punia"
            style={{ color: "#37B5B6" }}
          >
            Chirag
          </a>
        </h4>
      </footer>
    </div>
  );
};

export default Home;
