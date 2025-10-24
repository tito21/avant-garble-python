import "./ChatBubble.css"

function ChatBubble(props: {text: string, direction: 'left' | 'right', id: number, finished: boolean}) {
  const { text, direction, id, finished } = props;

  return (
    <div className={"chat-bubble " +  direction} key={id} id={id.toString()}>
      <p>{text}</p>
      {finished ? <div className="chat-bubble-finished"><span>✔️</span></div> : null}
    </div>
  )
}

export default ChatBubble
