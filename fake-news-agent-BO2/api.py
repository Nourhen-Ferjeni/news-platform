from flask import Flask, request, jsonify
from flask_cors import CORS
from core.rag_pipeline import verify_claim
from agents.memory_manager import init_memory, load_memory_as_dict
import os
import re

app = Flask(__name__)
CORS(app)

# Initialisation
init_memory()

def format_for_react_response(result):
    """Convertit la réponse Python en format compatible avec votre composant React"""
    
    verdict_map = {
        "TRUE": "TRUE",
        "FALSE": "FALSE", 
        "PARTIALLY TRUE": "MIXED",
        "UNVERIFIED": "MIXED"
    }
    
    # Extraire les sections du détail
    details = result['verdict']['details']
    justification = ""
    key_evidence = []
    convincing_source = ""
    
    # Parser le texte structuré de manière plus robuste
    lines = details.split('\n')
    current_section = ""
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        line_lower = line.lower()
        
        if 'justification:' in line_lower:
            justification = line.split(':', 1)[1].strip()
            current_section = "justification"
        elif 'key_evidence:' in line_lower:
            evidence_text = line.split(':', 1)[1].strip()
            # Nettoyer et formater les preuves
            evidence_text = re.sub(r'\*\*|\*|#+', '', evidence_text)
            # Séparer les éléments de preuve en gardant la structure
            evidence_items = [item.strip() for item in evidence_text.split(';') if item.strip()]
            key_evidence = evidence_items
            current_section = "key_evidence"
        elif 'convincing_source:' in line_lower:
            convincing_source = line.split(':', 1)[1].strip()
            current_section = "convincing_source"
        else:
            # Continuer à ajouter au contenu de la section
            if current_section == "justification":
                justification += " " + line
            elif current_section == "key_evidence" and key_evidence:
                # Ajouter aux preuves existantes
                key_evidence[-1] += " " + line
            elif current_section == "convincing_source":
                convincing_source += " " + line
    
    # Nettoyer le texte final
    justification = re.sub(r'\s+', ' ', justification).strip()
    convincing_source = re.sub(r'\s+', ' ', convincing_source).strip()
    
    # Si aucune preuve n'a été trouvée, utiliser une valeur par défaut
    if not key_evidence:
        key_evidence = ["Aucune preuve spécifique identifiée lors de l'analyse"]
    
    # Formater les sources pour React
    consulted_sources = []
    if 'sources' in result and result['sources']:
        for source in result['sources']:
            consulted_sources.append({
                "title": source.get('title', 'Sans titre'),
                "url": source.get('link', ''),
                "source_type": source.get('source', 'Source inconnue'),
                "summary": source.get('summary', source.get('snippet', 'Aucun résumé disponible'))
            })
    
    # Déterminer le niveau de confiance
    confidence = result['verdict']['confidence'] * 100
    if confidence >= 80:
        confidence_level = "High Confidence"
    elif confidence >= 50:
        confidence_level = "Medium Confidence" 
    else:
        confidence_level = "Low Confidence"
    
    return {
        "verdict": verdict_map.get(result['verdict']['verdict'], "MIXED"),
        "confidence": round(confidence, 1),  # Arrondir à 1 décimale
        "confidenceLevel": confidence_level,
        "justification": justification or "Analyse basée sur les sources disponibles.",
        "keyEvidence": key_evidence,
        "mostConvincingSource": convincing_source or "Sources consultées lors de l'analyse",
        "consulted_sources": consulted_sources,
        "from_cache": result.get('from_cache', False),
        "similar_claim": result.get('similar_claim', '')
    }

@app.route('/api/verify', methods=['POST'])
def verify_claim_endpoint():
    data = request.json
    claim = data.get('claim', '')
    content_type = data.get('contentType', 'article')
    
    if not claim or len(claim.strip()) < 10:
        return jsonify({'error': 'La revendication doit contenir au moins 10 caractères'}), 400
    
    try:
        # Utiliser votre pipeline existant
        result = verify_claim(claim)
        
        # Formater pour React
        formatted_result = format_for_react_response(result)
        
        return jsonify(formatted_result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    limit = request.args.get('limit', 10, type=int)
    history = load_memory_as_dict(limit)
    return jsonify(history)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'version': '4.0'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)