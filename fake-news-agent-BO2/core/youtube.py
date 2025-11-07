import os
import json
import time
import asyncio
import aiohttp
import requests
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse, quote_plus
import logging
from typing import List, Dict, Optional
import re
import random

# Third-party imports
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import yt_dlp
import whisper
import torch
from langchain_google_genai import ChatGoogleGenerativeAI

# --- Configuration des dossiers ---
BASE_OUTPUT_DIR = "all_news"
VIDEO_DIR = os.path.join(BASE_OUTPUT_DIR, "videos")
AUDIO_DIR = os.path.join(BASE_OUTPUT_DIR, "audio")
TRANSCRIPTION_DIR = os.path.join(BASE_OUTPUT_DIR, "transcriptions")
LOG_DIR = "logs"

# Création des dossiers
os.makedirs(BASE_OUTPUT_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(TRANSCRIPTION_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# --- Configuration du logging avancé ---
def setup_logging():
    """Configuration du logging avec fichiers séparés"""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Formateur personnalisé
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Handler pour le fichier principal
    main_handler = logging.FileHandler(
        os.path.join(LOG_DIR, f'youtube_scraper_{datetime.now().strftime("%Y%m%d")}.log'), 
        encoding='utf-8'
    )
    main_handler.setFormatter(formatter)
    
    # Handler pour les erreurs
    error_handler = logging.FileHandler(
        os.path.join(LOG_DIR, f'errors_{datetime.now().strftime("%Y%m%d")}.log'), 
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    
    # Handler console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    # Nettoyer les handlers existants
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Ajouter les nouveaux handlers
    logger.addHandler(main_handler)
    logger.addHandler(error_handler)
    logger.addHandler(console_handler)
    
    return logger

# Initialisation du logging
logger = setup_logging()

# --- Configuration Complète ---
CONFIG = {
    "OUTPUT_DIR": BASE_OUTPUT_DIR,
    "VIDEO_DIR": VIDEO_DIR,
    "AUDIO_DIR": AUDIO_DIR,
    "TRANSCRIPTION_DIR": TRANSCRIPTION_DIR,
    "LOG_DIR": LOG_DIR,
    "CHECK_INTERVAL": 900,  # 15 minutes
    "MAX_RESULTS_PER_SOURCE": 20,
    "REQUEST_TIMEOUT": 45,
    "USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "RETRY_ATTEMPTS": 3,
    "RETRY_DELAY": 5,
    "YOUTUBE_API_KEY": "AIzaSyBidoKVHNcv624Fp4coXVBUzWKgf6ouNAk",
    "YOUTUBE_MAX_RESULTS": 20,
    "WHISPER_MODEL": "base",  # base, small, medium, large
    "MAX_AUDIO_DURATION": 600,  # 10 minutes maximum pour l'extraction audio
    "MAX_VIDEOS_TO_PROCESS": 1,  # SEULEMENT 2 VIDÉOS À TRAITER
    "MAX_CONTENT_LENGTH": 10000,  # Longueur maximale pour le résumé
    "GEMINI_API_KEY": "AIzaSyB0kDVdaGNU9s2LF1odlqiQzFTl0ivJSWk"
}

def summarize_text(text: str) -> str:
    """Summarize the given text using Gemini."""
    api_key = CONFIG["GEMINI_API_KEY"]
    if not api_key:
        return "Error: GOOGLE_API_KEY not set."
    
    try:
        # Vérifier si le texte est trop court pour un résumé
        if len(text.strip()) < 100:
            return "Le texte est trop court pour générer un résumé significatif."
        
        # Initialiser le modèle Gemini
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0,
            google_api_key=api_key
        )
        
        # Préparer le prompt pour le résumé
        prompt = f"""
You are a professional news analyst specializing in Middle East affairs. 
Summarize the following text in concise, factual bullet points only.

Focus on:
- Main events and developments
- Key actors and stakeholders
- Important locations and timelines
- Significant statements or decisions
- Humanitarian or security implications

Be objective, analytical, and comprehensive. 
Do not include any introductory sentences — start directly with the bullet points.

Text to summarize:
{text[:CONFIG['MAX_CONTENT_LENGTH']]}

Summary in bullet points:
"""
        
        logger.info("🔄 Génération du résumé avec Gemini...")
        response = llm.invoke(prompt)
        summary = response.content.strip()
        
        logger.info("✅ Résumé généré avec succès")
        return summary
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la génération du résumé: {e}")
        return f"Erreur lors de la génération du résumé: {str(e)}"

def calculate_relevance_score(text: str) -> float:
    """Calcule un score de pertinence basé sur les termes d'actualité"""
    if not text:
        return 0.0
    
    text_lower = text.lower()
    score = 0.0
    
    # Termes d'actualité généraux avec poids
    news_terms = {
        "breaking": 3.0, "news": 2.0, "update": 2.0, "latest": 2.0,
        "report": 1.5, "analysis": 1.5, "today": 1.0, "developing": 2.5,
        "crisis": 2.0, "election": 2.0, "summit": 2.0, "deal": 1.5,
        "official": 1.0, "government": 1.5, "president": 1.5, "minister": 1.0
    }
    
    for term, weight in news_terms.items():
        if term in text_lower:
            score += weight
    
    # Normaliser le score
    return min(score / 10.0, 1.0)

def detect_language(text: str) -> Optional[str]:
    """Détection de langue simplifiée"""
    if not text or len(text.strip()) < 10:
        return None
    
    # Détection basique basée sur des mots communs
    text_lower = text.lower()
    
    english_words = ['the', 'and', 'for', 'with', 'this', 'that', 'have', 'from']
    french_words = ['le', 'la', 'les', 'des', 'avec', 'dans', 'pour', 'sur']
    arabic_chars = ['ال', 'في', 'من', 'على', 'أن', 'هذا', 'هذه']
    
    if any(word in text_lower for word in english_words):
        return "en"
    elif any(word in text_lower for word in french_words):
        return "fr"
    elif any(char in text for char in arabic_chars):
        return "ar"
    else:
        return None

def extract_key_topics(text: str) -> List[str]:
    """Extraction des thèmes principaux du texte"""
    topics = {
        "politics": ["election", "government", "president", "minister", "parliament", "vote", "policy"],
        "economy": ["economy", "market", "stock", "inflation", "recession", "trade", "business"],
        "technology": ["tech", "ai", "artificial intelligence", "digital", "internet", "software", "innovation"],
        "health": ["health", "medical", "hospital", "disease", "vaccine", "pandemic", "medicine"],
        "environment": ["climate", "environment", "weather", "pollution", "green", "energy", "sustainability"],
        "sports": ["sports", "game", "match", "championship", "team", "player", "tournament"],
        "entertainment": ["movie", "film", "celebrity", "music", "show", "award", "festival"],
        "international": ["international", "global", "world", "summit", "diplomacy", "united nations"],
        "conflict": ["conflict", "war", "attack", "crisis", "tension", "protest", "demonstration"],
        "science": ["science", "research", "study", "discovery", "scientist", "space", "technology"]
    }
    
    detected_topics = []
    text_lower = text.lower()
    for topic, keywords in topics.items():
        if any(keyword in text_lower for keyword in keywords):
            detected_topics.append(topic)
    
    return detected_topics

class AudioTranscriber:
    """Classe pour gérer l'extraction audio et la transcription"""
    
    def __init__(self):
        self.audio_dir = CONFIG["AUDIO_DIR"]
        self.transcription_dir = CONFIG["TRANSCRIPTION_DIR"]
        self.whisper_model = None
        self.model_loaded = False
        
    def load_whisper_model(self):
        """Charge le modèle Whisper"""
        try:
            logger.info(f"🔄 Chargement du modèle Whisper: {CONFIG['WHISPER_MODEL']}")
            self.whisper_model = whisper.load_model(CONFIG["WHISPER_MODEL"])
            self.model_loaded = True
            logger.info("✅ Modèle Whisper chargé avec succès")
        except Exception as e:
            logger.error(f"❌ Erreur lors du chargement du modèle Whisper: {e}")
            self.model_loaded = False
    
    def extract_audio(self, video_url: str, video_id: str) -> Optional[str]:
        """Extrait l'audio d'une vidéo YouTube"""
        try:
            audio_filename = f"{video_id}.mp3"
            audio_path = os.path.join(self.audio_dir, audio_filename)
            
            # Vérifier si l'audio existe déjà
            if os.path.exists(audio_path):
                logger.info(f"🎵 Audio déjà existant: {audio_filename}")
                return audio_path
            
            # Configuration yt-dlp pour extraire l'audio
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(self.audio_dir, f'{video_id}.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'quiet': True,
                'no_warnings': True,
                'extractaudio': True,
                'audioformat': 'mp3',
                'max_filesize': 50 * 1024 * 1024,  # 50MB max
            }
            
            logger.info(f"🎵 Extraction audio pour: {video_id}")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
            
            if os.path.exists(audio_path):
                logger.info(f"✅ Audio extrait: {audio_path}")
                return audio_path
            else:
                logger.error(f"❌ Échec de l'extraction audio pour: {video_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'extraction audio {video_id}: {e}")
            return None
    
    def transcribe_audio(self, audio_path: str, video_id: str) -> Optional[Dict]:
        """Transcrit l'audio en texte avec Whisper"""
        try:
            if not self.model_loaded:
                self.load_whisper_model()
                if not self.model_loaded:
                    return None
            
            # Vérifier si la transcription existe déjà
            transcription_filename = f"{video_id}.json"
            transcription_path = os.path.join(self.transcription_dir, transcription_filename)
            
            if os.path.exists(transcription_path):
                logger.info(f"📝 Transcription déjà existante: {transcription_filename}")
                with open(transcription_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            
            # Vérifier la taille du fichier audio
            file_size = os.path.getsize(audio_path) / (1024 * 1024)  # MB
            if file_size > 50:  # 50MB max
                logger.warning(f"⚠️ Fichier audio trop volumineux: {file_size:.2f}MB")
                return None
            
            logger.info(f"📝 Début de la transcription: {video_id}")
            
            # Transcrire l'audio
            result = self.whisper_model.transcribe(
                audio_path,
                fp16=torch.cuda.is_available(),  # Utiliser FP16 si GPU disponible
                language=None,  # Détection automatique de la langue
                task="transcribe"
            )
            
            # Préparer les données de transcription
            transcription_data = {
                "video_id": video_id,
                "text": result["text"],
                "language": result["language"],
                "duration": round(result["segments"][-1]["end"] if result["segments"] else 0, 2),
                "word_count": len(result["text"].split()),
                "segments": [
                    {
                        "start": round(segment["start"], 2),
                        "end": round(segment["end"], 2),
                        "text": segment["text"].strip(),
                        "confidence": round(segment.get("confidence", 0), 3)
                    }
                    for segment in result["segments"]
                ],
                "transcribed_at": datetime.utcnow().isoformat(),
                "model_used": CONFIG["WHISPER_MODEL"]
            }
            
            # Sauvegarder la transcription
            with open(transcription_path, 'w', encoding='utf-8') as f:
                json.dump(transcription_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ Transcription terminée: {video_id} ({transcription_data['word_count']} mots)")
            return transcription_data
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la transcription {video_id}: {e}")
            return None
    
    def process_video(self, video_data: Dict) -> Dict:
        """Traite une vidéo: extraction audio + transcription"""
        video_id = video_data.get("video_id")
        video_url = video_data.get("url")
        
        if not video_id or not video_url:
            logger.error("❌ Données vidéo manquantes pour le traitement")
            return video_data
        
        logger.info(f"🔊 Traitement de la vidéo: {video_id}")
        
        # Extraire l'audio
        audio_path = self.extract_audio(video_url, video_id)
        
        if audio_path:
            # Transcrire l'audio
            transcription = self.transcribe_audio(audio_path, video_id)
            
            if transcription:
                # Générer le résumé avec Gemini
                logger.info(f"📊 Génération du résumé pour: {video_id}")
                summary = summarize_text(transcription["text"])
                
                # Ajouter les données de transcription aux métadonnées de la vidéo
                video_data["audio_extracted"] = True
                video_data["audio_path"] = audio_path
                video_data["transcription"] = transcription
                video_data["summary"] = summary
                video_data["transcription_path"] = os.path.join(
                    self.transcription_dir, f"{video_id}.json"
                )
                logger.info(f"✅ Traitement complet réussi: {video_id}")
            else:
                video_data["audio_extracted"] = True
                video_data["transcription"] = None
                video_data["summary"] = None
                video_data["transcription_error"] = "Échec de la transcription"
                logger.warning(f"⚠️ Transcription échouée: {video_id}")
        else:
            video_data["audio_extracted"] = False
            video_data["transcription"] = None
            video_data["summary"] = None
            video_data["transcription_error"] = "Échec de l'extraction audio"
            logger.warning(f"⚠️ Extraction audio échouée: {video_id}")
        
        return video_data

class YouTubeNewsScraper:
    def __init__(self):
        self.output_dir = CONFIG["OUTPUT_DIR"]
        self.video_dir = CONFIG["VIDEO_DIR"]
        self.transcriber = AudioTranscriber()
        
        # Client YouTube API
        try:
            self.youtube = build('youtube', 'v3', developerKey=CONFIG["YOUTUBE_API_KEY"])
            logger.info("YouTube API client initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur initialisation YouTube API: {e}")
            self.youtube = None
        
        # Chaînes YouTube étendues (médias internationaux, chaînes d'info)
        self.youtube_channels = [
            # Médias internationaux
            "AlJazeeraEnglish", "BBCNews", "CNN", "Reuters", "skynews", 
            "FRANCE24English", "DWNews", "APNews", "Bloomberg",
            # Chaînes d'information américaines
            "FoxNews", "MSNBC", "CBSNews", "ABCNews", "NBCNews",
            # Chaînes spécialisées
            "TechCrunch", "WIRED", "NationalGeographic", "TED",
            # Chaînes régionales
            "euronews", "TRTWorld", "CGTNOfficial", "arirangworld"
        ]

    def extract_video_id(self, url: str) -> Optional[str]:
        """
        Extrait l'ID d'une vidéo YouTube depuis l'URL
        """
        try:
            # Patterns d'URL YouTube
            patterns = [
                r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\n]+)',
                r'youtube\.com\/embed\/([^&?\n]+)',
                r'youtube\.com\/v\/([^&?\n]+)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, url)
                if match:
                    return match.group(1)
            
            return None
        except Exception as e:
            logger.error(f"Erreur extraction ID vidéo: {e}")
            return None

    def transcribe_specific_video(self, video_url: str) -> Dict:
        """
        Transcription d'une vidéo YouTube spécifique sur demande
        """
        try:
            logger.info(f"🎯 Transcription demandée pour: {video_url}")
            
            # Extraire l'ID de la vidéo depuis l'URL
            video_id = self.extract_video_id(video_url)
            if not video_id:
                return {
                    "status": "error",
                    "message": "URL YouTube invalide"
                }
            
            # Vérifier si la vidéo existe via l'API YouTube
            try:
                video_response = self.youtube.videos().list(
                    part="snippet,statistics,contentDetails",
                    id=video_id
                ).execute()
                
                if not video_response.get("items"):
                    return {
                        "status": "error", 
                        "message": "Vidéo non trouvée sur YouTube"
                    }
                    
                video_details = video_response["items"][0]
                snippet = video_details["snippet"]
                stats = video_details.get("statistics", {})
                content_details = video_details.get("contentDetails", {})
                
            except Exception as e:
                logger.error(f"Erreur API YouTube pour {video_id}: {e}")
                return {
                    "status": "error",
                    "message": f"Erreur lors de la récupération des détails: {str(e)}"
                }
            
            # Créer l'objet vidéo de base
            video_data = {
                "video_id": video_id,
                "url": video_url,
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "description": snippet.get("description", "")[:500],
                "published_at": snippet.get("publishedAt", ""),
                "duration": content_details.get("duration", ""),
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "thumbnail": snippet["thumbnails"].get("high", {}).get("url", ""),
                "requested_at": datetime.utcnow().isoformat()
            }
            
            # Traiter la vidéo (audio + transcription + résumé)
            processed_video = self.transcriber.process_video(video_data)
            
            if processed_video.get("transcription"):
                return {
                    "status": "success",
                    "message": "Transcription et résumé terminés avec succès",
                    "video_data": {
                        "id": processed_video["video_id"],
                        "title": processed_video["title"],
                        "channel": processed_video["channel"],
                        "duration": processed_video["duration"],
                        "views": processed_video["view_count"],
                        "thumbnail": processed_video["thumbnail"],
                        "published_at": processed_video["published_at"],
                        "transcript": processed_video["transcription"]["text"],
                        "language": processed_video["transcription"]["language"],
                        "word_count": processed_video["transcription"]["word_count"],
                        "summary": processed_video.get("summary", ""),
                        "audio_extracted": processed_video["audio_extracted"],
                        "transcription_path": processed_video.get("transcription_path")
                    }
                }
            else:
                return {
                    "status": "error",
                    "message": "Échec de la transcription",
                    "video_data": {
                        "id": processed_video["video_id"],
                        "title": processed_video["title"],
                        "channel": processed_video["channel"],
                        "audio_extracted": processed_video["audio_extracted"],
                        "error": processed_video.get("transcription_error", "Unknown error")
                    }
                }
                
        except Exception as e:
            logger.error(f"Erreur lors de la transcription spécifique: {e}")
            return {
                "status": "error",
                "message": f"Erreur lors de la transcription: {str(e)}"
            }

    def save_video_data(self, data: Dict, filename: str) -> Dict[str, str]:
        """Sauvegarde les données vidéo"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        saved_files = {}
        
        try:
            # Sauvegarder les données vidéo
            video_filename = f"youtube_news_{filename}_{timestamp}.json"
            video_filepath = os.path.join(self.video_dir, video_filename)
            
            with open(video_filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            saved_files["video"] = video_filepath
            logger.info(f"🎥 Données vidéo sauvegardées: {video_filepath}")
            
            # Sauvegarder également un fichier complet dans le dossier principal
            complete_filename = f"complete_news_{timestamp}.json"
            complete_filepath = os.path.join(self.output_dir, complete_filename)
            with open(complete_filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            saved_files["complete"] = complete_filepath
            logger.info(f"📦 Données complètes sauvegardées: {complete_filepath}")
            
        except Exception as e:
            logger.error(f"Erreur sauvegarde des données: {e}")
            
        return saved_files

    def fetch_youtube_content(self) -> List[Dict]:
        """Récupération contenu YouTube via API officielle - TOUTES les actualités"""
        all_videos = []
        
        if not self.youtube:
            logger.error("YouTube API non initialisée")
            return all_videos
        
        # Requêtes de recherche étendues pour toutes les actualités
        search_queries = [
            # Actualités générales
            "breaking news", "latest news", "world news", "today news", "news update",
            # Catégories d'actualités
            "politics news", "economy news", "technology news", "health news", 
            "sports news", "entertainment news", "environment news", "science news",
            # Actualités internationales
            "international news", "global news", "europe news", "asia news", 
            "america news", "africa news", "middle east news",
            "actualités", "infos", "journal", "nouvelles", "information"
        ]
        
        # On étend la recherche à 3 derniers jours pour plus de contenu
        published_after = (datetime.utcnow() - timedelta(days=4)).isoformat() + "Z"

        # --- Boucle principale sur requêtes de recherche ---
        for query in search_queries:
            try:
                logger.info(f"🔎 Recherche YouTube : '{query}'")
                search_response = self.youtube.search().list(
                    q=query,
                    part="snippet",
                    type="video",
                    maxResults=CONFIG["YOUTUBE_MAX_RESULTS"],
                    order="date",
                    publishedAfter=published_after,
                    regionCode="US",
                    relevanceLanguage="en"
                ).execute()
                
                for search_result in search_response.get("items", []):
                    try:
                        video_id = search_result["id"]["videoId"]
                        snippet = search_result["snippet"]

                        # Récupérer les détails complets de la vidéo
                        video_response = self.youtube.videos().list(
                            part="snippet,contentDetails,statistics",
                            id=video_id
                        ).execute()

                        if not video_response.get("items"):
                            continue

                        video_details = video_response["items"][0]
                        stats = video_details.get("statistics", {})
                        content_details = video_details.get("contentDetails", {})

                        title = snippet.get("title", "")
                        description = snippet.get("description", "")
                        channel = snippet.get("channelTitle", "")

                        # Filtrage moins restrictif - accepter plus de contenu
                        content_lower = (title + " " + description).lower()
                        
                        # Éviter le contenu non-informatif
                        excluded_terms = ["music video", "trailer", "movie", "song", "lyrics", "gaming", "gameplay"]
                        if any(term in content_lower for term in excluded_terms):
                            continue

                        detected_language = detect_language(title + " " + description)
                        if detected_language not in ["fr", "en"]:
                            continue

                        # Déterminer le type de contenu
                        content_type = "news"
                        if any(term in content_lower for term in ["podcast", "episode", "show"]):
                            content_type = "podcast"
                        elif any(term in content_lower for term in ["interview", "discussion", "talk"]):
                            content_type = "interview"
                        elif any(term in content_lower for term in ["documentary", "report", "investigation"]):
                            content_type = "documentary"
                        elif any(term in content_lower for term in ["analysis", "explained", "breakdown"]):
                            content_type = "analysis"
                        elif any(term in content_lower for term in ["breaking", "urgent", "developing"]):
                            content_type = "breaking"

                        # Enrichir les métadonnées vidéo
                        video_data = {
                            "type": "youtube_video",
                            "platform": "youtube",
                            "title": title,
                            "url": f"https://www.youtube.com/watch?v={video_id}",
                            "video_id": video_id,
                            "published_at": snippet.get("publishedAt", ""),
                            "channel": channel,
                            "channel_id": snippet.get("channelId", ""),
                            "description": description[:1000],
                            "duration": content_details.get("duration", ""),
                            "view_count": int(stats.get("viewCount", 0)),
                            "like_count": int(stats.get("likeCount", 0)),
                            "comment_count": int(stats.get("commentCount", 0)),
                            "thumbnail": snippet["thumbnails"].get("high", {}).get("url", ""),
                            "content_type": content_type,
                            "language":  detected_language,
                            "topics": extract_key_topics(title + " " + description),
                            "scraped_at": datetime.utcnow().isoformat(),
                            "relevance_score": calculate_relevance_score(title + " " + description),
                            "search_query": query,
                            "audio_extracted": False,
                            "transcription": None,
                            "summary": None
                        }
                        all_videos.append(video_data)
                    except Exception as inner_e:
                        logger.warning(f"⚠️ Erreur lors du traitement vidéo YouTube: {inner_e}")
                        continue
                
                logger.info(f"🎥 {len(search_response.get('items', []))} vidéos récupérées pour '{query}'")
                
                # Pause pour éviter les limites de quota
                time.sleep(random.uniform(1, 2))

            except HttpError as e:
                if e.resp.status == 403:
                    logger.error(f"🚫 Quota YouTube API dépassé pour '{query}': {e}")
                    break  # Arrêter complètement si quota dépassé
                else:
                    logger.error(f"Erreur API YouTube pour '{query}': {e}")
            except Exception as e:
                logger.error(f"Erreur inattendue YouTube '{query}': {e}")
        
        # --- Déduplication ---
        seen_ids = set()
        unique_videos = []
        for video in all_videos:
            vid = video.get("video_id")
            if vid and vid not in seen_ids:
                seen_ids.add(vid)
                unique_videos.append(video)
        
        # Trier par date de publication (plus récent en premier)
        unique_videos.sort(key=lambda x: x.get('published_at', ''), reverse=True)
        
        logger.info(f"✅ YouTube total: {len(unique_videos)} vidéos d'actualités collectées")
        return unique_videos

    def process_videos_with_audio_transcription(self, videos: List[Dict]) -> List[Dict]:
        """Traite les vidéos avec extraction audio et transcription - SEULEMENT LES 5 PREMIÈRES"""
        processed_videos = []
        successful_transcriptions = 0
        
        # MODIFICATION : Prendre seulement les premières vidéos
        videos_to_process = videos[:CONFIG["MAX_VIDEOS_TO_PROCESS"]]
        total_videos = len(videos_to_process)
        
        logger.info(f"🎯 Traitement de {total_videos} vidéos (limité à {CONFIG['MAX_VIDEOS_TO_PROCESS']})")
        
        for i, video in enumerate(videos_to_process):
            logger.info(f"🔊 Traitement {i+1}/{total_videos}: {video.get('video_id')}")
            
            # Traiter la vidéo (audio + transcription + résumé)
            processed_video = self.transcriber.process_video(video)
            processed_videos.append(processed_video)
            
            if processed_video.get("transcription"):
                successful_transcriptions += 1
            
            # Pause pour éviter la surcharge
            time.sleep(1)
        
        # AJOUT : Garder les autres vidéos sans traitement
        remaining_videos = videos[total_videos:]
        processed_videos.extend(remaining_videos)
        
        logger.info(f"🎯 Transcriptions réussies: {successful_transcriptions}/{total_videos}")
        logger.info(f"📊 Total vidéos avec audio/transcription: {successful_transcriptions}/{len(videos)}")
        
        return processed_videos

    async def collect_all_data(self) -> Dict:
        """Collection de toutes les données YouTube avec audio et transcription LIMITÉE"""
        logger.info("Début de la collecte des données YouTube...")
        start_time = time.time()
        
        # Collecte YouTube
        youtube_data = self.fetch_youtube_content()
        
        # Traitement audio et transcription LIMITÉ aux premières
        if youtube_data:
            logger.info(f"🎵 Début de l'extraction audio et transcription (limité à {CONFIG['MAX_VIDEOS_TO_PROCESS']} vidéos)...")
            youtube_data = self.process_videos_with_audio_transcription(youtube_data)
        
        elapsed_time = time.time() - start_time
        
        # Statistiques des thèmes
        topic_stats = {}
        
        # MODIFICATION : Statistiques plus précises
        processed_videos = youtube_data[:CONFIG["MAX_VIDEOS_TO_PROCESS"]]
        remaining_videos = youtube_data[CONFIG["MAX_VIDEOS_TO_PROCESS"]:]
        
        audio_extracted_count = sum(1 for v in processed_videos if v.get("audio_extracted", False))
        transcriptions_successful = sum(1 for v in processed_videos if v.get("transcription"))
        summaries_generated = sum(1 for v in processed_videos if v.get("summary"))
        
        transcription_stats = {
            "total_videos": len(youtube_data),
            "videos_processed": len(processed_videos),
            "videos_not_processed": len(remaining_videos),
            "audio_extracted": audio_extracted_count,
            "transcriptions_successful": transcriptions_successful,
            "transcriptions_failed": audio_extracted_count - transcriptions_successful,
            "summaries_generated": summaries_generated
        }
        
        for video in youtube_data:
            for topic in video.get('topics', []):
                topic_stats[topic] = topic_stats.get(topic, 0) + 1
        
        # Statistiques des types de contenu
        content_type_stats = {}
        for video in youtube_data:
            content_type = video.get('content_type', 'unknown')
            content_type_stats[content_type] = content_type_stats.get(content_type, 0) + 1
        
        return {
            "metadata": {
                "scraping_session_id": datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
                "timestamp": datetime.utcnow().isoformat(),
                "scraping_duration_seconds": round(elapsed_time, 2),
                "topic_statistics": topic_stats,
                "content_type_statistics": content_type_stats,
                "transcription_statistics": transcription_stats,
                "processing_limit": CONFIG["MAX_VIDEOS_TO_PROCESS"],
                "sources_count": {
                    "youtube_videos": len(youtube_data),
                    "unique_channels": len(set(video.get('channel', '') for video in youtube_data))
                }
            },
            "data": {
                "youtube_videos": youtube_data
            }
        }