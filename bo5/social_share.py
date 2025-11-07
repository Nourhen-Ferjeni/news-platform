# social_share.py
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import logging

logger = logging.getLogger(__name__)

# ---------------------------
# Facebook Page Integration (robust)
# - Adds timeouts, retries and clear error handling
# ---------------------------

# Create a session with retries
def _create_session(retries: int = 3, backoff_factor: float = 1.0, status_forcelist=(429, 500, 502, 503, 504)) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('https://', adapter)
    session.mount('http://', adapter)
    return session


def share_to_facebook(page_id: str, page_access_token: str, message: str, image_path: str | None = None, timeout: tuple | float = (5, 30)) -> dict:
    """
    Share a post on a Facebook page.
    - page_id: ID of the Facebook page
    - page_access_token: access token for the page
    - message: text content of the post
    - image_path: optional local path to an image
    - timeout: requests timeout (connect, read) or single float

    Returns a dict with the parsed JSON response on success or an error dict on failure.
    """
    session = _create_session()

    try:
        if image_path:
            url = f"https://graph.facebook.com/v24.0/{page_id}/photos"
            data = {'caption': message, 'access_token': page_access_token}
            # Use context manager to ensure file is closed
            with open(image_path, 'rb') as f:
                files = {'source': f}
                resp = session.post(url, files=files, data=data, timeout=timeout)
        else:
            url = f"https://graph.facebook.com/v24.0/{page_id}/feed"
            data = {'message': message, 'access_token': page_access_token}
            resp = session.post(url, data=data, timeout=timeout)

        # If the response isn't JSON, return text for debugging
        try:
            resp_json = resp.json()
        except ValueError:
            logger.error("Facebook response not JSON: %s", resp.text)
            return {"status": "error", "http_status": resp.status_code, "response_text": resp.text}

        if resp.ok:
            return resp_json
        else:
            # Return response body and status for the caller to inspect
            logger.error("Facebook API returned error %s: %s", resp.status_code, resp_json)
            return {"status": "error", "http_status": resp.status_code, "response": resp_json}

    except requests.exceptions.RequestException as e:
        # Log the exception with context, don't leak sensitive tokens
        logger.exception("Request to Facebook Graph API failed: %s", str(e))
        return {"status": "error", "error": str(e)}
