import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Allow CORS for all domains to simplify connection from separate frontend deployment
CORS(app)

# N8N Webhook URLs
N8N_LIVE_URL = "https://aclhxamj.rpcld.net/webhook/3ace2731-d228-4c1c-b785-dfd27f31f187"
N8N_TEST_URL = "https://aclhxamj.rpcld.net/webhook-test/3ace2731-d228-4c1c-b785-dfd27f31f187"

def get_n8n_url():
    """Determine which n8n URL to use based on environment variable."""
    # Check for string "true" (case-insensitive)
    use_test = os.environ.get("USE_TEST_WEBHOOK", "false").lower() == "true"
    return N8N_TEST_URL if use_test else N8N_LIVE_URL

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "MuDo backend is running"}), 200

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data:
             return jsonify({"error": "Invalid JSON body"}), 400
        
        message = data.get("message")
        
        # Get language from request, default to 'en'
        # Validate that it is one of the supported languages
        input_lang = data.get("lang", "en")
        lang = input_lang if input_lang in ["en", "de", "tr"] else "en"
        
        session_id = data.get("sessionId", "web-client-default")
        
        if not message:
            return jsonify({"error": "Message field is required"}), 400

        # Prepare parameters for n8n
        # Based on successful Postman test, n8n expects 'text' and 'sessionid'
        params = {
            "text": message,  # Mapped from 'message' to 'text'
            "sessionid": session_id,
            "lang": lang
        }
        
        n8n_url = get_n8n_url()
        
        # Header to mimic a browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        # Call n8n webhook
        # IMPORTANT: n8n workflow expects a JSON BODY even with GET method
        print(f"Calling n8n URL: {n8n_url}")
        print(f"Params: {params}")
        response = requests.get(n8n_url, json=params, headers=headers, timeout=30)
        
        if response.status_code == 200:
            try:
                n8n_data = response.json()
                
                # Handle List response: [{"output": "..."}]
                if isinstance(n8n_data, list) and len(n8n_data) > 0:
                    n8n_data = n8n_data[0]
                
                # Expecting {"output": "..."}
                if isinstance(n8n_data, dict) and "output" in n8n_data:
                    return jsonify(n8n_data), 200
                else:
                    # Fallback if structure is different
                    return jsonify({"output": str(n8n_data)}), 200
            except ValueError:
                 # In case response is not JSON
                 return jsonify({"output": response.text}), 200
        else:
            print(f"n8n error: {response.status_code} - {response.text}")
            return jsonify({"error": "Failed to retrieve response from AI service."}), 500

    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    # Render provides PORT env var
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

