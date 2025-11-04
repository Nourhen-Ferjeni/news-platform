# app.py

from pipeline import full_pipeline

if __name__ == "__main__":
    user_text = input("Enter your post idea: ")

    result = full_pipeline(user_text)

    print("\n🚀 Processing Complete")
    print("Keywords:", result["keywords"])
    print("Sentiment:", result["sentiment"])
    print("Prompt Used:", result["prompt"])
    print("Generated Image:", result["image_path"])
