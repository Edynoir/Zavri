"""
WikiHow Article Fetcher & Mongolian Translator (v2)
Fetches raw wikiHow HTML, uses Gemini to extract structured data,
translates to Mongolian, and outputs JSON.
"""

import json
import time
import os
import urllib.request
import urllib.parse
import re

# --- Configuration ---
def get_api_key():
    for env_file_name in ['.env.local', '.env']:
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), env_file_name)
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    if line.startswith('VITE_GEMINI_API_KEY='):
                        key = line.split('=', 1)[1].strip()
                        if key and key != 'your_gemini_api_key_here':
                            return key
    return os.environ.get('VITE_GEMINI_API_KEY', '')

GEMINI_API_KEY = get_api_key()
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'data', 'wikihow_lessons.json')

# Search queries
SEARCH_QUERIES = [
    ("create a strong password", "Technology"),
    ("connect to wifi", "Technology"),
    ("create a gmail account", "Technology"),
    ("take a screenshot", "Technology"),
    ("use a VPN", "Technology"),
    ("boil an egg", "Cooking"),
    ("make pizza at home", "Cooking"),
    ("wake up early", "Lifestyle"),
    ("reduce stress", "Lifestyle"),
    ("improve vocabulary", "Education"),
    ("study for an exam", "Education"),
    ("exercise at home", "Health"),
    ("save money", "Finance"),
]

def call_gemini(prompt):
    """Call Gemini REST API directly."""
    if not GEMINI_API_KEY:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}]
    }).encode('utf-8')

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            text = data['candidates'][0]['content']['parts'][0]['text']
            return text.replace("```json", "").replace("```", "").strip()
    except Exception as e:
        print(f"  Gemini API error: {e}")
        return None

def fetch_html(url):
    """Fetch raw HTML from a URL."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"  Fetch error for {url}: {e}")
        return None

def search_wikihow_url(query):
    """Find the first wikiHow article URL for a query via Google Search or direct guess."""
    # Constructing a direct URL guess is often correct for wikiHow
    # "create a strong password" -> "Create-a-Strong-Password"
    slug = "-".join([w.capitalize() for w in query.split()])
    url = f"https://www.wikihow.com/{slug}"
    return url

def process_article(query, category):
    """Fetch, extract, and translate an article."""
    url = search_wikihow_url(query)
    print(f"  Fetching: {url}")
    
    html = fetch_html(url)
    if not html:
        # Try lowercase version
        url = url.lower()
        html = fetch_html(url)
        if not html:
            return None

    print(f"  Extracting and translating to Mongolian...")
    
    # We send a truncated version of HTML to Gemini to stay within limits
    # and focus on the main content area (usually <div id="bodycontents">)
    truncated_html = html[:30000] # Take first 30k chars which usually covers steps
    
    prompt = f"""You are a content extractor and translator. 
Given the provided wikiHow HTML, extract the following information and translate it into MONGOLIAN (Cyrillic).

Category: {category}
URL: {url}

Information to extract and translate:
1. Title (Mongolian)
2. Summary/Intro (2-3 sentences in Mongolian)
3. Steps (At least 4-5 steps):
   - Title (Mongolian)
   - Detailed Description (2-3 sentences in Mongolian)
   - 2-3 Tips (Mongolian)
4. Relevant Tags (3-4 tags in Mongolian)

Return ONLY a valid JSON object:
{{
    "title": "Mongolian Title",
    "summary": "Mongolian Summary",
    "steps": [
        {{
            "title": "Step title",
            "content": "Step description",
            "tips": ["Tip 1", "Tip 2"]
        }}
    ],
    "tags": ["tag1", "tag2"]
}}

HTML Snippet:
{truncated_html}

IMPORTANT: Return ONLY the JSON object. No explanation."""

    raw_json = call_gemini(prompt)
    if not raw_json:
        return None

    try:
        data = json.loads(raw_json)
        
        # Add metadata
        lesson_steps = []
        for i, step in enumerate(data.get('steps', [])):
            lesson_steps.append({
                "id": f"step-{i+1}",
                "title": step.get('title', ''),
                "content": step.get('content', ''),
                "tips": step.get('tips', []),
            })
            
        return {
            "title": data.get('title', query),
            "category": category,
            "summary": data.get('summary', ''),
            "author": "WikiHow",
            "isPaid": False,
            "sourceUrl": url,
            "tags": data.get('tags', [category.lower()]),
            "steps": lesson_steps,
        }
    except Exception as e:
        print(f"  JSON Parse error: {e}")
        return None

def main():
    print("=" * 60)
    print("  WikiHow Robust Fetcher & Mongolian Translator")
    print("=" * 60)

    if not GEMINI_API_KEY:
        print("  ERROR: VITE_GEMINI_API_KEY not found. Exit.")
        return

    lessons = []
    total = len(SEARCH_QUERIES)

    for i, (query, category) in enumerate(SEARCH_QUERIES):
        print(f"\n[{i+1}/{total}] Topic: '{query}'")
        
        lesson = process_article(query, category)
        if lesson:
            lessons.append(lesson)
            print(f"  ✅ Success: {lesson['title']}")
        else:
            print(f"  ❌ Failed")
            
        time.sleep(2) # Prevent being blocked

    # Save to file
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"  Done! {len(lessons)} articles processed.")
    print(f"  Saved to: {OUTPUT_FILE}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
