from typing import Generator, MutableMapping

import pickle
import dbm
import random

from nltk.tokenize import word_tokenize


def get_gram(input_text: str, n: int = 3, append: bool = False) -> tuple[str]:
    tokens = word_tokenize(input_text)
    if len(tokens) < n:
        if append:
            tokens = ["."] * (n - len(tokens)) + tokens
        else:
            raise ValueError(f"Input text must contain at least {n} tokens.")
    return tuple(tokens[-n:])


def generate_text(
    current_gram: tuple[str],
    model: MutableMapping[str, list[str]] | MutableMapping[bytes, bytes],
    num_tokens: int = 50,
) -> str:
    output = []
    for next_word in token_generator(current_gram, model, num_tokens):
        if next_word is None:
            break
        output.append(next_word)
    return " ".join(output)


def token_generator(
    current_gram: tuple[str],
    model: MutableMapping[str, list[str]] | MutableMapping[bytes, bytes],
    num_tokens: int = 50,
) -> Generator[str, None]:
    i = 0
    while i < num_tokens:
        if isinstance(model, dict):
            possibilities = model.get(current_gram)
        else:
            possibilities = (
                pickle.loads(model[pickle.dumps(current_gram)])
                if pickle.dumps(current_gram) in model
                else None
            )
        if not possibilities:
            print("No possibilities found, stopping generation.")
            yield None
            break
        next_word = random.choice(possibilities)
        i += 1
        current_gram = (*current_gram[1:], next_word)
        yield next_word


def load_pickle_model(file_path: str) -> MutableMapping[str, list[str]]:
    with open(file_path, "rb") as f:
        model = pickle.load(f)
    return model


def load_model(db_path: str) -> MutableMapping[bytes, bytes]:
    return dbm.open(db_path, "r")
