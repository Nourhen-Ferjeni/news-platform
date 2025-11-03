from flask import Flask, request, jsonify
from flask_cors import CORS
from agents.memory_manager import init_memory
from core.youtube import YouTubeNewsScraper, summarize_text
import asyncio

app = Flask(__name__)
CORS(app)

# Initialisation
init_memory()

@app.route('/scrape_youtube', methods=['GET'])
def scrape_youtube():
    """
    Lance la collecte des vidéos YouTube + transcription (limitée à 5)
    """
    try:
        scraper = YouTubeNewsScraper()
        data = asyncio.run(scraper.collect_all_data())  # Exécute la fonction asynchrone
        return jsonify({
            "status": "success",
            "message": "Scraping terminé avec succès",
            "metadata": data["metadata"],
            "data": data["data"]
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors du scraping : {str(e)}"
        }), 500

@app.route('/transcribe_video', methods=['POST'])
def transcribe_video():
    """
    Transcription d'une vidéo YouTube spécifique
    Exemple: {"video_url": "https://www.youtube.com/watch?v=VIDEO_ID"}
    """
    try:
        data = request.get_json()
        
        if not data or 'video_url' not in data:
            return jsonify({
                "status": "error",
                "message": "URL de la vidéo requise"
            }), 400
        
        video_url = data['video_url'].strip()
        
        # Validation basique de l'URL
        if not video_url.startswith(('https://www.youtube.com/', 'https://youtu.be/')):
            return jsonify({
                "status": "error", 
                "message": "URL YouTube invalide"
            }), 400
        
        scraper = YouTubeNewsScraper()
        result = scraper.transcribe_specific_video(video_url)
        
        return jsonify(result), 200 if result["status"] == "success" else 400
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la transcription: {str(e)}"
        }), 500

@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    """
    Génère un résumé pour un texte donné
    Exemple: {"text": "Texte à résumer..."}
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                "status": "error",
                "message": "Texte requis pour générer le résumé"
            }), 400
        
        text = data['text'].strip()
        
        if len(text) < 50:
            return jsonify({
                "status": "error",
                "message": "Le texte est trop court pour générer un résumé significatif"
            }), 400
        
        # Générer le résumé
        summary = summarize_text(text)
        
        return jsonify({
            "status": "success",
            "message": "Résumé généré avec succès",
            "summary": summary,
            "original_text_length": len(text),
            "summary_length": len(summary)
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la génération du résumé: {str(e)}"
        }), 500

@app.route('/summarize_video', methods=['POST'])
def summarize_video():
    """
    Génère un résumé pour une vidéo spécifique (via son ID ou URL)
    Exemple: {"video_id": "VIDEO_ID"} ou {"video_url": "https://www.youtube.com/watch?v=VIDEO_ID"}
    """
    try:
        data = request.get_json()
        
        if not data or ('video_id' not in data and 'video_url' not in data):
            return jsonify({
                "status": "error",
                "message": "ID ou URL de la vidéo requis"
            }), 400
        
        scraper = YouTubeNewsScraper()
        
        # Déterminer l'URL de la vidéo
        if 'video_url' in data:
            video_url = data['video_url'].strip()
        else:
            video_id = data['video_id'].strip()
            video_url = f"https://www.youtube.com/watch?v={video_id}"
        
        # Validation basique de l'URL
        if not video_url.startswith(('https://www.youtube.com/', 'https://youtu.be/')):
            return jsonify({
                "status": "error", 
                "message": "URL YouTube invalide"
            }), 400
        
        # D'abord transcrire la vidéo
        transcription_result = scraper.transcribe_specific_video(video_url)
        
        if transcription_result["status"] != "success":
            return jsonify(transcription_result), 400
        
        # Extraire le texte de la transcription
        transcript = transcription_result["video_data"]["transcript"]
        
        if not transcript or len(transcript.strip()) < 50:
            return jsonify({
                "status": "error",
                "message": "La transcription est trop courte pour générer un résumé"
            }), 400
        
        # Générer le résumé
        summary = summarize_text(transcript)
        
        return jsonify({
            "status": "success",
            "message": "Résumé généré avec succès",
            "video_data": {
                "id": transcription_result["video_data"]["id"],
                "title": transcription_result["video_data"]["title"],
                "channel": transcription_result["video_data"]["channel"],
                "transcript_length": len(transcript),
                "summary": summary,
                "summary_length": len(summary)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors de la génération du résumé vidéo: {str(e)}"
        }), 500

@app.route('/scrape_youtube/topic', methods=['GET'])
def scrape_youtube_topic():
    """
    Lance la collecte et renvoie uniquement les vidéos liées à un thème spécifique
    Exemple : /scrape_youtube/topic?theme=politics
    """
    theme = request.args.get('theme', '').lower()
    try:
        scraper = YouTubeNewsScraper()
        data = asyncio.run(scraper.collect_all_data())
        all_videos = data["data"]["youtube_videos"]

        if theme:
            filtered = [v for v in all_videos if theme in [t.lower() for t in v.get("topics", [])]]
        else:
            filtered = all_videos

        return jsonify({
            "status": "success",
            "theme": theme or "all",
            "count": len(filtered),
            "videos": filtered,
            "metadata": data["metadata"]
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erreur lors du filtrage par thème : {str(e)}"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'version': '4.0'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)