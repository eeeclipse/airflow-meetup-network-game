import dotenv
import argparse
import logging
import os
from core.log import logger  # core/log.py의 logger 사용

from main import app

dotenv.load_dotenv("config/.env")

# Argument parser for log level
parser = argparse.ArgumentParser(
    description="Start the application with specified log level."
)
parser.add_argument(
    "--log-level",
    type=str,
    default="INFO",
    choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
    help="Set the logging level (default: INFO)",
)
args = parser.parse_args()
print(args)

# Set logging level for the logger
logger.setLevel(getattr(logging, args.log_level.upper(), "INFO"))

def main():
    import uvicorn

    # Number of uvicorn worker processes. Each worker re-loads the
    # full FastAPI app (~80MB) so on small VMs (Fly 512MB) running
    # the default 4 workers OOMs immediately. Set UVICORN_WORKERS=1
    # via fly secrets for the 50-person meetup deploy; leave it
    # unset on a beefier dev box to keep the upstream default.
    workers = int(os.getenv("UVICORN_WORKERS", "4"))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        reload=False,
        workers=workers,
        log_level=args.log_level.lower(),
        # log_config=None  # uvicorn 기본 로깅 비활성화
    )

if __name__ == "__main__":
    main()
