# # backend/app/services/social_poster.py
# # ==============================================================
# # ⚙️ Imports
# # ==============================================================
# from transformers import pipeline as hf_pipeline
# from keybert import KeyBERT
# # from stable_diffusion_cpp import StableDiffusion
# from PIL import Image
# import re
# import os
# import traceback
# import time

# # ==============================================================
# # Configuration
# # ==============================================================
# MODEL_PATH = "models/stable-diffusion-v1-5-pruned-emaonly-Q4_0.gguf"
# WIDTH = 512
# HEIGHT = 512
# STEPS = 20
# CFG_SCALE = 7.0

# # ==============================================================
# # 🔧 Load Models
# # ==============================================================
# sd_model = None
# summarizer = None
# sentiment_model = None
# kw_model = None

# def load_models():
#     global sd_model, summarizer, sentiment_model, kw_model
#     # try:
#     #     print("🟦 Loading Stable Diffusion model...")
#     #     sd_model = StableDiffusion(model_path=MODEL_PATH, n_threads=8)
#     #     print("✅ Stable Diffusion model loaded successfully")
#     # except Exception as e:
#     #     print(f"❌ Error loading Stable Diffusion model: {e}")
#     #     print(traceback.format_exc())

#     try:
#         summarizer = hf_pipeline("summarization", model="facebook/bart-large-cnn")
#         sentiment_model = hf_pipeline("sentiment-analysis")
#         kw_model = KeyBERT()
#         print("✅ NLP models loaded successfully")
#     except Exception as e:
#         print(f"❌ Error loading NLP models: {e}")

# # Load models on startup
# load_models()

# # ==============================================================
# # 🧪 NLP Helper Functions
# # ==============================================================
# def smart_summarize(text):
#     try:
#         if len(text.strip()) < 50:
#             return text
#         return summarizer(text, max_length=60, min_length=25, do_sample=False)[0]["summary_text"]
#     except Exception as e:
#         print(f"❌ Error in summarization: {e}")
#         return text[:100] + "..." if len(text) > 100 else text

# def extract_keywords(text, k=5):
#     try:
#         kws = kw_model.extract_keywords(text, keyphrase_ngram_range=(1,2), stop_words='english', top_n=k)
#         return [kw[0] for kw in kws]
#     except Exception as e:
#         print(f"❌ Error extracting keywords: {e}")
#         return ["news", "update", "information"]

# def sentiment_to_emojis(text):
#     try:
#         text_lower = text.lower()

#         topic_emoji_map = {
#             "technology": "🤖💡", "ai": "🤖🧠", "artificial intelligence": "🤖🧠",
#             "war": "⚔️🕊️🔥", "conflict": "⚠️🛑🕊️", "economy": "📉📈💰",
#             "market": "💹📊", "climate": "🌍🔥", "sport": "🏅💪",
#             "health": "🏥🩺", "politics": "🏛️📜", "business": "📊💼",
#         }

#         for keyword, emojis in topic_emoji_map.items():
#             if keyword in text_lower:
#                 return emojis
        
#         sentiment = sentiment_model(text[:512])[0]["label"]
#         if sentiment == "POSITIVE":
#             return "✨✅😊"
#         elif sentiment == "NEGATIVE":
#             return "⚠️😟🚨"
#         else:
#             return "🤔📌"
#     except Exception as e:
#         print(f"❌ Error in sentiment analysis: {e}")
#         return "📰✨"

# def keywords_to_hashtags(keywords):
#     try:
#         hashtags = []
#         for kw in keywords:
#             kw = re.sub(r"[^a-zA-Z0-9]", "", kw)
#             if kw:
#                 hashtags.append("#" + kw.capitalize())
#         return " ".join(hashtags[:5])
#     except Exception as e:
#         print(f"❌ Error creating hashtags: {e}")
#         return "#News #Update"

# def get_gguf_prompts(summary: str, emojis: str, hashtags: str):
#     try:
#         subject = summary.split('.')[0].strip()
        
#         positive_prompt = f"""
# professional photojournalism, {subject},
# high quality, detailed, realistic, natural lighting,
# news photography style, current events
# """.strip()

#         negative_prompt = """
# cartoon, anime, painting, CGI, digital art, low quality, blurry,
# distorted, overexposed, underexposed, text, watermark, signature
# """.strip()

#         return positive_prompt, negative_prompt
#     except Exception as e:
#         print(f"❌ Error creating prompts: {e}")
#         return "news photography, professional", "cartoon, anime, blurry"

# # ==============================================================
# # 🖼️ Image Generation Function
# # ==============================================================
# IMAGES_DIR = "generated" 

# def generate_image(prompt: str, negative_prompt: str, output_filename="generated_image.png"):
#     # try:
#     #     os.makedirs(IMAGES_DIR, exist_ok=True)
#     #     full_path = os.path.join(IMAGES_DIR, output_filename)

#     #     print("🟦 Starting image generation...")
#     #     print(f"🟦 Prompt: {prompt[:100]}...")
        
#     #     start_time = time.time()

#     #     image = sd_model.generate_image(
#     #         prompt=prompt,
#     #         negative_prompt=negative_prompt,
#     #         width=WIDTH,
#     #         height=HEIGHT,
#     #         sample_steps=STEPS,
#     #         cfg_scale=CFG_SCALE,
#     #         seed=-1
#     #     )

#     #     generation_time = time.time() - start_time
#     #     print(f"✅ Image generated in {generation_time:.2f} seconds")

#     #     if isinstance(image, list):
#     #         image = image[0]

#     #     image.save(full_path)
#     #     print(f"✅ Image saved to: {full_path}")
        
#     #     return f"{IMAGES_DIR}/{output_filename}"
        
#     # except Exception as e:
#     #     print(f"❌ Error in image generation: {e}")
#     #     print(traceback.format_exc())
        
#     print("🟨 Creating placeholder image...")
#     try:
#         placeholder = Image.new('RGB', (512, 512), color='lightgray')
#         placeholder_path = os.path.join(IMAGES_DIR, "placeholder.png")
#         placeholder.save(placeholder_path)
#         return f"{IMAGES_DIR}/placeholder.png"
#     except:
#         return None

# # ==============================================================
# # 🚀 Full Pipeline
# # ==============================================================
# def full_pipeline(text: str):
#     try:
#         print("🟦 Starting pipeline...")
        
#         summary = smart_summarize(text)
#         keywords = extract_keywords(summary)
#         emojis = sentiment_to_emojis(summary)
#         hashtags = keywords_to_hashtags(keywords)
#         pos_prompt, neg_prompt = get_gguf_prompts(summary, emojis, hashtags)
#         image_path = generate_image(pos_prompt, neg_prompt)
        
#         result = {
#             "text": text,
#             "summary": summary,
#             "keywords": keywords,
#             "emojis": emojis,
#             "hashtags": hashtags,
#             "prompt": pos_prompt,
#             "image_path": image_path
#         }
        
#         print("✅ Pipeline completed successfully")
#         return result
        
#     except Exception as e:
#         print(f"❌ Error in pipeline: {e}")
#         print(traceback.format_exc())
        
#         return {
#             "text": text,
#             "summary": text[:100] + "..." if len(text) > 100 else text,
#             "keywords": ["news", "article"],
#             "emojis": "📰✨",
#             "hashtags": "#News #Article",
#             "prompt": "news article",
#             "image_path": None
#         }
