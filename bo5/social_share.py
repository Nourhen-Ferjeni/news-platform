# social_share.py
import requests

# ---------------------------
# Facebook Page Integration
# ---------------------------
def share_to_facebook(page_id, page_access_token, message, image_path=None):
    """
    Share a post on a Facebook page.
    - page_id: ID of the Facebook page
    - page_access_token: access token for the page
    - message: text content of the post
    - image_path: optional local path to an image
    """
    if image_path:
        # Post image + message
        url = f"https://graph.facebook.com/v24.0/{page_id}/photos"
        files = {'source': open(image_path, 'rb')}
        data = {'caption': message, 'access_token': page_access_token}
        resp = requests.post(url, files=files, data=data)
    else:
        # Post text only
        url = f"https://graph.facebook.com/v24.0/{page_id}/feed"
        data = {'message': message, 'access_token': page_access_token}
        resp = requests.post(url, data=data)

    return resp.json()
