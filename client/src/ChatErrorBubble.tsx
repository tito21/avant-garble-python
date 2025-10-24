import './ChatBubble.css'

function ChatErrorBubble(props: {text: string, id: number}) {
  const { text, id } = props;
  return (
    <div className={"chat-bubble error"} key={id} id={id.toString()}>
      <p>{text}</p>
    </div>
  )
}

export default ChatErrorBubble
