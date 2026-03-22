import requests
import logging

logger = logging.getLogger(__name__)

ML_SERVICE_URL = "http://127.0.0.1:8001"


def process_cv_with_ml(file_path: str) -> dict | None:
    """
    Sends the CV file to the ML service and returns the parsed result.
    Returns None if the ML service is unavailable or fails.
    """
    try:
        with open(file_path, "rb") as f:
            filename = file_path.split("/")[-1]
            response = requests.post(
                f"{ML_SERVICE_URL}/process-cv",
                files={"file": (filename, f)},
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