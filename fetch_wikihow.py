"""
WikiHow Article Fetcher & Mongolian Translator (v3 - API Powered)
Uses WikiHow MediaWiki API to find articles and Gemini to extract/translate.
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

def wikihow_api_call(params):
    """Make a call to the WikiHow MediaWiki API."""
    base_url = "https://www.wikihow.com/api.php?"
    params['format'] = 'json'
    url = base_url + urllib.parse.urlencode(params)
    headers = {
        'User-Agent': 'Zavri-Fetcher/2.0 (Educational Project; Mongolian Translation)'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"  WikiHow API error: {e}")
        return None

def search_wikihow_article(query):
    """Search for the best wikiHow article match for a query."""
    data = wikihow_api_call({
        'action': 'query',
        'list': 'search',
        'srsearch': query,
        'srlimit': 1
    })
    if data and data.get('query', {}).get('search'):
        result = data['query']['search'][0]
        return result['title'], result['pageid']
    return None, None

def get_article_html(pageid):
    """Fetch the parsed HTML for a specific pageid."""
    data = wikihow_api_call({
        'action': 'parse',
        'pageid': pageid,
        'prop': 'text'
    })
    if data and data.get('parse', {}).get('text', {}).get('*'):
        return data['parse']['text']['*']
    return None

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

def process_article(query, category):
    """Search, fetch, and translate an article."""
    title, pageid = search_wikihow_article(query)
    if not title:
        print(f"  ❌ Article not found for: {query}")
        return None
    
    source_url = f"https://www.wikihow.com/{title.replace(' ', '-')}"
    print(f"  Found: {title} (ID: {pageid})")
    
    html = get_article_html(pageid)
    if not html:
        print(f"  ❌ Failed to fetch content for: {title}")
        return None

    # Clean HTML slightly to save tokens
    clean_html = re.sub(r'<script.*?</script>', '', html, flags=re.DOTALL)
    clean_html = re.sub(r'<style.*?</style>', '', clean_html, flags=re.DOTALL)
    clean_html = re.sub(r'<!--.*?-->', '', clean_html, flags=re.DOTALL)
    truncated_html = clean_html[:25000]

    prompt = f"""You are a content extractor and translator. 
Given the provided wikiHow HTML, extract the following information and translate it into MONGOLIAN (Cyrillic).

Original Title: {title}
Category: {category}
URL: {source_url}

Information to extract and translate:
1. Mongolian Title (Natural and clear)
2. Summary/Intro (2-3 sentences in Mongolian)
3. Steps (At least 5 steps if available):
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
        
        lesson_steps = []
        for i, step in enumerate(data.get('steps', [])):
            lesson_steps.append({
                "id": f"step-{i+1}",
                "title": step.get('title', ''),
                "content": step.get('content', ''),
                "tips": step.get('tips', []),
            })
            
        return {
            "title": data.get('title', title),
            "category": category,
            "summary": data.get('summary', ''),
            "author": "WikiHow",
            "isPaid": False,
            "sourceUrl": source_url,
            "tags": data.get('tags', [category.lower()]),
            "steps": lesson_steps,
        }
    except Exception as e:
        print(f"  JSON Parse error: {e}")
        return None

def main():
    print("=" * 60)
    print("  WikiHow Robust API Fetcher & Mongolian Translator")
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
            
        time.sleep(1) # Prevent being blocked

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
