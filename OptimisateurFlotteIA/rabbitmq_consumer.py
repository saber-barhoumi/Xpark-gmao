"""RabbitMQ event-driven mode (FICHE_TECHNIQUE §2.3).

Consumes  : xpark.missions.ready-for-optimization   (published by Mission.API)
Publishes : xpark.optimization.plan-generated       (consumed by Mission.API)

Topology: durable topic exchange `xpark.ai`, durable queue
`optimizer.ready-for-optimization`. Plain JSON payloads (camelCase) matching
models.OptimizeRequest / models.OptimizeResponse — language-agnostic, no
MassTransit envelope.

The consumer runs in a daemon thread started by main.py; it reconnects
forever with backoff so the service keeps working even if RabbitMQ restarts
(graceful degradation, §9.2).
"""

import json
import logging
import os
import threading
import time

import pika

from models import OptimizeRequest
from optimizer import optimize

logger = logging.getLogger("fleet-optimizer.rabbitmq")

EXCHANGE = "xpark.ai"
QUEUE = "optimizer.ready-for-optimization"
RK_REQUEST = "xpark.missions.ready-for-optimization"
RK_PLAN = "xpark.optimization.plan-generated"

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "xpark")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "xpark_secret")

RETRY_DELAY_S = 5


def _handle_message(channel, method, properties, body: bytes) -> None:
    batch_id = "?"
    try:
        payload = json.loads(body)
        batch_id = payload.get("batchId", "?")
        logger.info("Event reçu [%s] batch=%s (%d missions)",
                    RK_REQUEST, batch_id, len(payload.get("missions", [])))

        req = OptimizeRequest(**payload)
        plan = optimize(req)
        result = plan.model_dump_json()
    except Exception as exc:
        # Graceful degradation (§9.3): publish an error result so Mission.API
        # can stop waiting and surface the reason to the admin.
        logger.exception("Optimization event failed for batch=%s", batch_id)
        result = json.dumps({
            "batchId": batch_id,
            "error": f"{type(exc).__name__}: {exc}",
        })

    channel.basic_publish(
        exchange=EXCHANGE,
        routing_key=RK_PLAN,
        body=result,
        properties=pika.BasicProperties(content_type="application/json",
                                        delivery_mode=2),
    )
    channel.basic_ack(delivery_tag=method.delivery_tag)
    logger.info("Plan publié [%s] batch=%s", RK_PLAN, batch_id)


def _consume_forever() -> None:
    while True:
        try:
            params = pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                credentials=pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS),
                heartbeat=60,
                blocked_connection_timeout=30,
            )
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)
            channel.queue_declare(queue=QUEUE, durable=True)
            channel.queue_bind(queue=QUEUE, exchange=EXCHANGE, routing_key=RK_REQUEST)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=QUEUE, on_message_callback=_handle_message)

            logger.info("Connecté à RabbitMQ (%s) — en écoute sur '%s'",
                        RABBITMQ_HOST, RK_REQUEST)
            channel.start_consuming()
        except Exception as exc:
            logger.warning("RabbitMQ indisponible (%s) — nouvelle tentative dans %ds",
                           exc, RETRY_DELAY_S)
            time.sleep(RETRY_DELAY_S)


def start_consumer_thread() -> threading.Thread:
    thread = threading.Thread(target=_consume_forever,
                              name="rabbitmq-consumer", daemon=True)
    thread.start()
    return thread
