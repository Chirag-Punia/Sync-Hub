import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "../pages/styles/Editor.css";
import ACTIONS from "../Actions";

const Editor = ({ socketRef, roomID }) => {
  console.log(socketRef.current);
  const editorRef = useRef(null);
  useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realTimeEditor"),
        {
          mode: {
            name: "javascript",
            json: true,
          },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );
      editorRef.current.on("change", (instance, changes) => {
        const code = instance.getValue();
        const { origin } = changes;
        if (origin !== "setValue") {
          setTimeout(1);
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomID,
            code,
          });
        }
      });
    }
    socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
      if (code !== null) {
        editorRef.current.setValue(code);
      }
    });
    init();
  });
  return (
    <>
      <textarea id="realTimeEditor" />
    </>
  );
};
export default Editor;
