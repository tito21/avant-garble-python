import logging
from typing import Generator, MutableMapping

import dbm
import random

from fastapi.logger import logger
from nltk.tokenize import word_tokenize
from nltk.tokenize.treebank import TreebankWordDetokenizer


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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

    sentence = TreebankWordDetokenizer().detokenize(output)
    return sentence


def token_generator(
    current_gram: tuple[str],
    model: dict[str, list[str]] | MutableMapping[bytes, bytes],
    num_tokens: int = 50,
) -> Generator[str, None]:
    i = 0
    while i < num_tokens:
        current_ngram_bytes = bytearray('\x00'.join(current_gram), 'utf-8')
        possibilities = (
            list(model[current_ngram_bytes].decode('utf-8').split('\x00'))
            if current_ngram_bytes in model
            else None
        )
        if not possibilities:
            logger.warning("No possibilities found, stopping generation.")
            yield None
            break
        next_word = random.choice(possibilities)
        i += 1
        current_gram = (*current_gram[1:], next_word)
        yield next_word


def load_model(db_path: str) -> MutableMapping[bytes, bytes]:
    return dbm.open(db_path, "r")
