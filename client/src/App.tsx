import { ReactElement, useState, useRef, useEffect } from 'react'
import useWebSocket from "react-use-websocket"

import Footer from './Footer'
import ChatBubble from './ChatBubble'
// import ChatBubbleResponse from './ChatBubbleResponse'
import ChatErrorBubble from './ChatErrorBubble'
import InputBox from './InputBox'

import './App.css'

const order = 3;

function getNgram(text: string, n: number): string {
  const tokens = text.split(" ");
  if (tokens.length >= n) {
    return tokens.slice(tokens.length - n, tokens.length).join(" ");
  }
  return tokens.join(" ") .padStart(n, " ");
}

enum MessageSuccess {
  SUCCESS,
  ERROR
}

function App() {

  const bubblesArray: ReactElement[] = [];
  const [bubblesState, setStatesBubble] = useState(bubblesArray);
  const [responseNumberState, setStatesResponseNumber] = useState(0);
  const [responseState, setStatesResponse] = useState("");
  let currentResponseBubble: ReactElement;
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  const [messageStatusState, setStatesMessageStatus] = useState<MessageSuccess>(MessageSuccess.ERROR);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(() => {
    scrollToBottom();
  }, [bubblesState]);


  const inputBox = InputBox((value) => {
    // console.log(value);
    let currentNgram = getNgram(value, order);
    console.log("Current ngram:", `"${currentNgram}"`);
    setStatesResponse("");
    // let url = `get-text?currentGram=${currentNgram}`;
    setStatesBubble(prevStateArray => [...prevStateArray, <ChatBubble text={value} direction='right' id={responseNumberState} finished={false}></ChatBubble>]);
    setStatesResponseNumber(responseNumberState + 1);
    console.log(messageStatusState, MessageSuccess.ERROR);
    sendMessage(currentNgram);
    if (messageStatusState === MessageSuccess.ERROR) {
      currentResponseBubble = <ChatErrorBubble text={responseState} id={responseNumberState}></ChatErrorBubble>;
    }
    else {
      currentResponseBubble = <ChatBubble text={responseState} direction='left' id={responseNumberState} finished={true}></ChatBubble>;
    }
    setStatesBubble(prevStateArray => [...prevStateArray, currentResponseBubble]);
    setStatesResponseNumber(responseNumberState + 1);

  });


  const url = new URL('/get-text', window.location.href);
  url.protocol = url.protocol.replace('http', 'ws');
  const wsUrl = url.href // => ws://www.example.com:9999/path/to/websocket

  const {
    sendMessage,
  } = useWebSocket(wsUrl, {
    shouldReconnect: () => true,
    onMessage: (event) => {
      // console.log("Message", event.data);
      if (event.data === "[DONE]") {
        let fullText = `${responseState}`;
        setStatesBubble(prevStateArray => {
          prevStateArray[prevStateArray.length - 1] = <ChatBubble text={fullText} direction='left' id={responseNumberState} finished={true}></ChatBubble>;
          return [...prevStateArray];
        });
        setStatesResponse("");
        setStatesMessageStatus(() => MessageSuccess.SUCCESS);
        return;
      }
      else if (event.data.startsWith("[ERROR]")) {
        console.error("Error from server:", event.data);
        setStatesBubble(prevStateArray => {
          const errorBubble = <ChatErrorBubble text={event.data} id={responseNumberState}></ChatErrorBubble>;
          prevStateArray[prevStateArray.length - 1] = errorBubble;
          return [...prevStateArray];
        });
        setStatesResponse(event.data);
        setStatesMessageStatus(() => MessageSuccess.ERROR);
        return;
      }

      // console.log("text", responseState);
      setStatesResponse(text => text + event.data);
      let fullText = `${responseState}`;
      setStatesBubble(prevStateArray => {
        prevStateArray[prevStateArray.length - 1] = <ChatBubble text={fullText} direction='left' id={responseNumberState} finished={false}></ChatBubble>;
        return [...prevStateArray];
      });
    },
    onError: (event) => {
      console.error("Error", event);
      setStatesBubble(prevStateArray => [...prevStateArray, <ChatErrorBubble text='Error getting response' id={responseNumberState}></ChatErrorBubble>]);
      setStatesMessageStatus(() => MessageSuccess.ERROR);
      return;
    },
    onClose: (event) => {
      console.log("Close", event);
      setStatesResponse(text => text);
      let fullText = `${responseState}`;
      setStatesBubble(prevStateArray => {
        prevStateArray[prevStateArray.length - 1] = <ChatBubble text={fullText} direction='left' id={responseNumberState} finished={true}></ChatBubble>;
        return [...prevStateArray];
      });

    },
  });


  return (
    <>
      <header>
        <img src="logo.svg" alt="Avant Garble Logo" />
        <h1>Avant Garble</h1>
      </header>
      <main>
        <div className="chat-container">
          {bubblesState}
        <div ref={chatEndRef}/>
        </div>
        {inputBox}
      </main>
      <Footer></Footer>
    </>
  )
}

export default App
