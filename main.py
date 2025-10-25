import logging

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import ngram

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeneratedResponse(BaseModel):
    generatedText: str
    success: bool


def load_model():
    model = ngram.load_model("model/3gram_model_small_bytes.cdb")
    # model = ngram.load_pickle_model("model/3gram_model.pkl")
    yield model
    # Shutdown the model if needed
    model.close()


app = FastAPI()


@app.get("/rest/get-text")
def get_text(input_text: str, num_words: int = 50, model=Depends(load_model)) -> GeneratedResponse:
    current_gram = ngram.get_gram(input_text, n=3, append=True)
    generated_text = ngram.generate_text(current_gram, model, num_tokens=num_words)
    success = True
    if not generated_text:
        generated_text = "[ERROR] I didn't understand that."
        success = False
    return GeneratedResponse(generatedText=generated_text, success=success)


@app.websocket("ws/get-text")
async def get_text_ws(websocket: WebSocket):
    await websocket.accept()
    model = ngram.load_model("model/3gram_model.cdb")
    try:
        while True:
            data = await websocket.receive_text()
            current_gram = ngram.get_gram(data, n=3, append=True)
            logger.info("Current gram: %s", current_gram)
            logger.info("model type: %s, length: %d", type(model), len(model))
            for next_word in ngram.token_generator(current_gram, model):
                if next_word is None:
                    await websocket.send_text("[ERROR] I didn't understand that.")
                    break
                await websocket.send_text(next_word + " ")
            else:
                await websocket.send_text("[DONE]")

    except WebSocketDisconnect:
        logger.info("Client disconnected")
    finally:
        model.close()


app.mount("/", StaticFiles(directory="./client/dist/", html=True), name="client")