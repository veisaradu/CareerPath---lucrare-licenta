import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def process_cv_with_ml(file_content: bytes, filename: str) -> dict | None:
    try:
        response = requests.post(
            f"{settings.ML_SERVICE_URL}/process-cv",
            files={"file": (filename, file_content)},
            timeout=30,
        )
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(
                "ML service error %s: %s",
                response.status_code,
                response.text,
            )
            return None
    except requests.exceptions.ConnectionError:
        logger.warning("ML service unavailable, skipping CV processing")
        return None
    except Exception as e:
        logger.exception("Unexpected error calling ML service: %s", e)
        return None