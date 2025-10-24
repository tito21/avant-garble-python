from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

import ngram


def load_model():
    model = ngram.load_model("model/3gram_model.cdb")
    # model = ngram.load_pickle_model("model/3gram_model.pkl")
    yield model
    # Shutdown the model if needed
    model.close()


app = FastAPI()


@app.get("/get-text-rest")
def get_text(input_text: str, model=Depends(load_model)):
    current_gram = ngram.get_gram(input_text, n=3, append=True)
    generated_text = ngram.generate_text(current_gram, model)
    return {"generatedText": generated_text}



@app.websocket("/get-text")
async def get_text_ws(websocket: WebSocket):
    await websocket.accept()
    model = ngram.load_model("model/3gram_model.cdb")
    try:
        while True:
            data = await websocket.receive_text()
            current_gram = ngram.get_gram(data, n=3, append=True)
            print("Current gram:", current_gram)
            for next_word in ngram.token_generator(current_gram, model):
                if next_word is None:
                    await websocket.send_text("[ERROR] I didn't understand that.")
                    break
                await websocket.send_text(next_word + " ")
            else:
                await websocket.send_text("[DONE]")

    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        model.close()


app.mount("/", StaticFiles(directory="./client/dist/", html=True), name="client")