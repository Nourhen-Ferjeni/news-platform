# ==============================================================
# ⚙️ Imports
# ==============================================================
from transformers import pipeline as hf_pipeline
from keybert import KeyBERT
from stable_diffusion_cpp import StableDiffusion
from PIL import Image
import re

# ==============================================================
# 🧠 NLP Models
# ==============================================================
summarizer = hf_pipeline("summarization", model="facebook/bart-large-cnn")
sentiment_model = hf_pipeline("sentiment-analysis")
kw_model = KeyBERT()

# ==============================================================
# 🧪 NLP Helper Functions
# ==============================================================
def smart_summarize(text):
    return summarizer(text, max_length=60, min_length=25, do_sample=False)[0]["summary_text"]

def extract_keywords(text, k=5):
    kws = kw_model.extract_keywords(text, keyphrase_ngram_range=(1,2), stop_words='english', top_n=k)
    return [kw[0] for kw in kws]

def sentiment_to_emojis(text):
    text_lower = text.lower()

    topic_emoji_map = {
        # War / Conflict
        "war": "⚔️🕊️🔥",
        "battle": "⚔️🔥",
        "military": "🪖🚁🔥",
        "conflict": "⚠️🛑🕊️",
        "attack": "🚨🔥",
        "army": "🪖🇺🇳",
        "soldier": "🪖🇺🇳",
        "bomb": "💥🚨",

        # Economy / Finance
        "economy": "📉📈💰",
        "market": "💹📊",
        "finance": "💵🏦",
        "bank": "🏦💳",
        "inflation": "📈⚠️",
        "crypto": "🪙🚀",

        # Technology / AI
        "technology": "🤖💡",
        "ai": "🤖🧠",
        "artificial intelligence": "🤖🧠",
        "robot": "🤖⚙️",
        "hacking": "💻🕵️‍♂️",
        "cyber": "🛡️💻",

        # Environment
        "climate": "🌍🔥",
        "earthquake": "🌍⚠️",
        "storm": "🌧️⚡",
        "fire": "🔥🚒",
        "flood": "🌊🚨",

        # Health
        "virus": "🦠🚑",
        "covid": "🦠😷",
        "disease": "🧬⚠️",
        "hospital": "🏥🩺",

        # Politics
        "election": "🗳️🇺🇳",
        "government": "🏛️📜",
        "president": "🏛️🇺🇳",

        # Sports
        "football": "⚽🏆",
        "sport": "🏅💪",

        # Innovation / Business
        "startup": "🚀💡",
        "innovation": "💡🚀",
        "business": "📊💼",
    }

    # Match topic keywords to emojis
    for keyword, emojis in topic_emoji_map.items():
        if keyword in text_lower:
            return emojis
    
    # Fallback to sentiment if no topic found
    sentiment = sentiment_model(text)[0]["label"]
    if sentiment == "POSITIVE":
        return "✨✅😊"
    elif sentiment == "NEGATIVE":
        return "⚠️😟🚨"
    else:
        return "🤔📌"


def keywords_to_hashtags(keywords):
    hashtags = []
    for kw in keywords:
        kw = re.sub(r"[^a-zA-Z0-9]", "", kw)
        if kw:
            hashtags.append("#" + kw.capitalize())
    return " ".join(hashtags)

# ==============================================================
# 🖼️ Stable Diffusion GGUF Config
# ==============================================================
MODEL_PATH = "models/stable-diffusion-v1-5-pruned-emaonly-Q4_0.gguf"
WIDTH = 512
HEIGHT = 512
STEPS = 40

def get_gguf_prompts(summary: str, emojis: str, hashtags: str):
    subject = summary.split('.')[0].strip()
    
    positive_prompt = f"""
realistic photograph of {subject},
daylight, realistic colors, normal perspective, natural lighting,
taken with a DSLR camera, photojournalism style, no text, no watermark
{emojis} {hashtags}
""".strip()

    negative_prompt = """
cartoon, anime, painting, CGI, digital art, low quality, blurry,
distorted, overexposed, underexposed, exaggerated lighting,
cinematic, dramatic, HDR, unrealistic
""".strip()

    return positive_prompt, negative_prompt


# ==============================================================
# 🔧 Load SD Model
# ==============================================================
def load_sd_model():
    sd_model = StableDiffusion(model_path=MODEL_PATH)
    return sd_model

sd_model = load_sd_model()

# ==============================================================
# 🖼️ Image Generation Function
# ==============================================================
import os

IMAGES_DIR = "generated" 

def generate_image(prompt: str, negative_prompt: str, output_filename="generated_image.png"):
    # Ensure folder exists
    os.makedirs(IMAGES_DIR, exist_ok=True)

    full_path = os.path.join(IMAGES_DIR, output_filename)

    image = sd_model.generate_image(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=WIDTH,
        height=HEIGHT,
        sample_steps=STEPS,
        cfg_scale=8
    )

    if isinstance(image, list):
        image = image[0]

    image.save(full_path)
    
    # Return relative path for frontend URL
    return f"{IMAGES_DIR}/{output_filename}"


# ==============================================================
# 🚀 Full Pipeline
# ==============================================================
def full_pipeline(text: str):
    summary = smart_summarize(text)
    keywords = extract_keywords(summary)
    emojis = sentiment_to_emojis(summary)
    hashtags = keywords_to_hashtags(keywords)

    pos_prompt, neg_prompt = get_gguf_prompts(summary, emojis, hashtags)
    image_path = generate_image(pos_prompt, neg_prompt)

    return {
        "text": text,
        "summary": summary,
        "keywords": keywords,
        "emojis": emojis,
        "hashtags": hashtags,
        "prompt": pos_prompt,
        "image_path": image_path
    }

# ==============================================================
# 🔹 Optional Test
# ==============================================================
if __name__ == "__main__":
    sample_text = "Internal documents reveal Apple knew the iPhone 6 was more likely to bend than previous models."
    result = full_pipeline(sample_text)
    print(result)
    Image.open(result["image_path"]).show()
