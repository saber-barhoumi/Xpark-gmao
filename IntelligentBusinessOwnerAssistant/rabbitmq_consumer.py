"""Event Receiver (FICHE §7.2-1) — consomme TOUS les événements métier XPARK.

Queue durable `iboa.events` liée à l'exchange topic `xpark.ai` avec la clé
`xpark.#` : tout événement publié par n'importe quel microservice
(xpark.fleet.*, xpark.mission.*, xpark.finance.*, …) arrive ici.
Reconnexion infinie avec backoff (FICHE §9.1).
"""

import json
import logging
import os
import threading
import time

import pika

import pipeline

logger = logging.getLogger("iboa.rabbitmq")

EXCHANGE = "xpark.ai"          # exchange topic partagé XPARK (déjà utilisé par l'optimiseur)
QUEUE = "iboa.events"
BINDING = "xpark.#"

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "xpark")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "xpark_secret")

RETRY_DELAY_S = 5
connected = False


def _handle_message(channel, method, properties, body: bytes) -> None:
    routing_key = method.routing_key
    try:
        payload = json.loads(body)
        event = pipeline.normalize(routing_key, payload)
        pipeline.process_event(event)
    except Exception:
        # Événement malformé → log + skip, ne jamais crasher (FICHE §9.1)
        logger.exception("Événement invalide sur '%s' — ignoré", routing_key)
    channel.basic_ack(delivery_tag=method.delivery_tag)


def _consume_forever() -> None:
    global connected
    while True:
        try:
            params = pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                credentials=pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS),
                heartbeat=60,
                blocked_connection_timeout=30)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)
            channel.queue_declare(queue=QUEUE, durable=True)
            channel.queue_bind(queue=QUEUE, exchange=EXCHANGE, routing_key=BINDING)
            channel.basic_qos(prefetch_count=5)
            channel.basic_consume(queue=QUEUE, on_message_callback=_handle_message)

            connected = True
            logger.info("Connecté à RabbitMQ (%s) — écoute '%s' sur exchange '%s'",
                        RABBITMQ_HOST, BINDING, EXCHANGE)
            channel.start_consuming()
        except Exception as exc:
            connected = False
            logger.warning("RabbitMQ indisponible (%s) — retry dans %ds", exc, RETRY_DELAY_S)
            time.sleep(RETRY_DELAY_S)


def publish_event(routing_key: str, payload: dict) -> None:
    """Utilisé par POST /test-event pour injecter un événement dans le bus réel."""
    params = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        credentials=pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS))
    connection = pika.BlockingConnection(params)
    try:
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)
        channel.basic_publish(
            exchange=EXCHANGE, routing_key=routing_key,
            body=json.dumps(payload, default=str),
            properties=pika.BasicProperties(content_type="application/json",
                                            delivery_mode=2))
    finally:
        connection.close()


def start_consumer_thread() -> threading.Thread:
    thread = threading.Thread(target=_consume_forever, name="iboa-consumer", daemon=True)
    thread.start()
    return thread
