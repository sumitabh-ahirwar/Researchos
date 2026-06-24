from langchain.tools import tool
import requests
from tavily import TavilyClient
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv
from rich import print
load_dotenv()

tavily_api_key = os.getenv("TAVILY_API_KEY")

tavily_client = TavilyClient(api_key=tavily_api_key)

@tool
def web_searcher(query: str) -> str:
    """
    Search the web for recent and reliables information on a topic.
    Returns Title , URLs and snippets.
    """
    result = tavily_client.search(query=query, max_results=5)
    out = []
    for r in result['results']:
        out.append(
            f"Title: {r['title']}\nURL: {r['url']}\nSnippet: {r['content']}\n"
        )
    
    return "\n-------\n".join(out)

@tool
def web_scraper(url: str) -> str:
    """
    Scrape the content of a web page and return the clean text content from a given URL for deeper reading.
    """
    try:
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for tag in soup(['script', 'style', 'header', 'footer', 'nav', 'aside']):
            tag.decompose()
        return soup.get_text(separator=' ', strip=True)[:3000]
    except Exception as e:
        return f"Error scraping {url}: {str(e)}"

