import { ReactElement, useState, useRef, useEffect } from 'react'

import Footer from './Footer'
import ChatBubble from './ChatBubble'
// import ChatBubbleResponse from './ChatBubbleResponse'
import ChatErrorBubble from './ChatErrorBubble'
import InputBox from './InputBox'

import './App.css'

function App() {

  const bubblesArray: ReactElement[] = [];
  const [bubblesState, setStatesBubble] = useState(bubblesArray);
  const [responseNumberState, setStatesResponseNumber] = useState(0);
  // const [responseState, setStatesResponse] = useState("");
  let currentResponseBubble: ReactElement;
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  // const [messageStatusState, setStatesMessageStatus] = useState<MessageSuccess>(MessageSuccess.SUCCESS);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(() => {
    scrollToBottom();
  }, [bubblesState]);


  const inputBox = InputBox(async (value) => {

    setStatesBubble(prevStateArray => [...prevStateArray, <ChatBubble text={value} direction='right' id={responseNumberState} finished={false}></ChatBubble>]);
    setStatesResponseNumber(responseNumberState + 1);
    currentResponseBubble = await sendMessage(value);
    setStatesBubble(prevStateArray => [...prevStateArray, currentResponseBubble]);
    setStatesResponseNumber(responseNumberState + 1);

  });

  const sendMessage = async (inputText: string) => {
    try {
      const response = await fetch(`/rest/get-text?input_text=${encodeURIComponent(inputText)}&num_words=50`);
      const data = await response.json();
      console.log(data, data.generatedText);
      // setStatesResponse(data.generatedText);
      if (data.success) {
        currentResponseBubble = <ChatBubble text={data.generatedText} direction='left' id={responseNumberState} finished={true}></ChatBubble>;
      } else {
        currentResponseBubble = <ChatErrorBubble text={data.generatedText} id={responseNumberState}></ChatErrorBubble>;
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      let message = "Error: Unable to fetch response from server.";
      currentResponseBubble = <ChatErrorBubble text={message} id={responseNumberState}></ChatErrorBubble>;

    }
    return currentResponseBubble;
  };

  return (
    <>
      <header>
        <img src="logo.svg" alt="Avant Garble Logo" />
        <h1>Avant Garble</h1>
      </header>
      <main>
        <div className="chat-container">
          {bubblesState}
          <div ref={chatEndRef} />
        </div>
        {inputBox}
      </main>
      <Footer></Footer>
    </>
  )
}

export default App
