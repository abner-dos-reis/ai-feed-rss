from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
from pydantic import BaseModel
import asyncio
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, init_db
from routers import rss, ai_apis, feeds, topics
from services.rss_processor import RSSProcessor
from services.ai_manager import AIManager
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Feed RSS application...")
    await init_db()
    
    # Start background RSS processing task
    rss_processor = RSSProcessor()
    ai_manager = AIManager()
    
    # Create background task for RSS processing
    async def process_rss_feeds():
        while True:
            try:
                await rss_processor.process_all_feeds()
                await asyncio.sleep(300)  # Process every 5 minutes
            except Exception as e:
                logger.error(f"Error in RSS processing: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    # Start background task
    task = asyncio.create_task(process_rss_feeds())
    
    yield
    
    # Shutdown
    task.cancel()
    logger.info("Shutting down AI Feed RSS application...")

app = FastAPI(
    title="AI Feed RSS",
    description="Intelligent RSS Feed Management with AI-powered organization",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure properly for production
)

# Include routers
app.include_router(rss.router, prefix="/api/rss", tags=["RSS Management"])
app.include_router(ai_apis.router, prefix="/api/ai-apis", tags=["AI APIs Management"])
app.include_router(feeds.router, prefix="/api/feeds", tags=["Feeds Display"])
app.include_router(topics.router, prefix="/api/topics", tags=["Topics Organization"])

@app.get("/")
async def root():
    return {
        "message": "AI Feed RSS API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "rss_management": "/api/rss",
            "ai_apis": "/api/ai-apis", 
            "feeds_display": "/api/feeds",
            "topics": "/api/topics",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "database": "connected",
            "ai_processor": "running",
            "rss_processor": "running"
        }
    }

# RSS Proxy endpoint to bypass CORS
class FeedRequest(BaseModel):
    url: str

@app.post("/api/rss-proxy")
async def rss_proxy(request: FeedRequest):
    """
    Proxy endpoint to fetch RSS feeds and bypass CORS restrictions
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                request.url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; AI-Feed-RSS/1.0)',
                    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
                },
                follow_redirects=True
            )
            response.raise_for_status()
            
            return Response(
                content=response.content,
                media_type="application/xml",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/xml; charset=utf-8"
                }
            )
    except httpx.HTTPError as e:
        logger.error(f"Error fetching RSS feed {request.url}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch RSS feed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in RSS proxy: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)