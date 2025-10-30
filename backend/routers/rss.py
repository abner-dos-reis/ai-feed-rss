from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db, RSSSource, RSSItem
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from services.rss_processor import RSSProcessor
from services.ai_manager import AIManager
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class RSSSourceCreate(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    source_type: str = "web"
    fetch_interval: int = 3600

class RSSSourceResponse(BaseModel):
    id: str
    name: str
    url: str
    description: Optional[str]
    source_type: str
    site_name: Optional[str]
    is_active: bool
    fetch_interval: int
    last_fetched: Optional[str]
    last_error: Optional[str]
    total_items: int
    created_at: str
    
    class Config:
        from_attributes = True

class RSSProcessRequest(BaseModel):
    source_ids: Optional[List[str]] = None  # If None, process all active sources

@router.get("/sources", response_model=List[RSSSourceResponse])
async def get_rss_sources(db: AsyncSession = Depends(get_db)):
    """Get all RSS sources"""
    result = await db.execute(select(RSSSource))
    sources = result.scalars().all()
    
    return [RSSSourceResponse(
        id=source.id,
        name=source.name,
        url=source.url,
        description=source.description,
        source_type=source.source_type,
        site_name=source.site_name,
        is_active=source.is_active,
        fetch_interval=source.fetch_interval,
        last_fetched=source.last_fetched.isoformat() if source.last_fetched else None,
        last_error=source.last_error,
        total_items=source.total_items,
        created_at=source.created_at.isoformat()
    ) for source in sources]

@router.post("/sources", response_model=RSSSourceResponse)
async def add_rss_source(
    source_data: RSSSourceCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Add a new RSS source and immediately process it"""
    
    # Check if URL already exists
    result = await db.execute(select(RSSSource).where(RSSSource.url == source_data.url))
    existing_source = result.scalar_one_or_none()
    
    if existing_source:
        raise HTTPException(status_code=400, detail="RSS source with this URL already exists")
    
    # Create new RSS source
    new_source = RSSSource(
        name=source_data.name,
        url=source_data.url,
        description=source_data.description,
        source_type=source_data.source_type,
        fetch_interval=source_data.fetch_interval
    )
    
    db.add(new_source)
    await db.commit()
    await db.refresh(new_source)
    
    # Process the RSS feed immediately in background
    rss_processor = RSSProcessor()
    background_tasks.add_task(rss_processor.process_source, new_source.id)
    
    return RSSSourceResponse(
        id=new_source.id,
        name=new_source.name,
        url=new_source.url,
        description=new_source.description,
        source_type=new_source.source_type,
        site_name=new_source.site_name,
        is_active=new_source.is_active,
        fetch_interval=new_source.fetch_interval,
        last_fetched=new_source.last_fetched.isoformat() if new_source.last_fetched else None,
        last_error=new_source.last_error,
        total_items=new_source.total_items,
        created_at=new_source.created_at.isoformat()
    )

@router.delete("/sources/{source_id}")
async def delete_rss_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an RSS source and all its items"""
    
    # Check if source exists
    result = await db.execute(select(RSSSource).where(RSSSource.id == source_id))
    source = result.scalar_one_or_none()
    
    if not source:
        raise HTTPException(status_code=404, detail="RSS source not found")
    
    # Delete the source (items will be deleted due to CASCADE)
    await db.execute(delete(RSSSource).where(RSSSource.id == source_id))
    await db.commit()
    
    return {"message": f"RSS source '{source.name}' deleted successfully"}

@router.post("/sources/{source_id}/toggle")
async def toggle_rss_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Toggle RSS source active status"""
    
    result = await db.execute(select(RSSSource).where(RSSSource.id == source_id))
    source = result.scalar_one_or_none()
    
    if not source:
        raise HTTPException(status_code=404, detail="RSS source not found")
    
    source.is_active = not source.is_active
    await db.commit()
    
    status = "activated" if source.is_active else "deactivated"
    return {"message": f"RSS source '{source.name}' {status}"}

@router.post("/process")
async def process_rss_feeds(
    request: RSSProcessRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger RSS processing for specific sources or all sources"""
    
    rss_processor = RSSProcessor()
    
    if request.source_ids:
        # Process specific sources
        for source_id in request.source_ids:
            result = await db.execute(select(RSSSource).where(RSSSource.id == source_id))
            source = result.scalar_one_or_none()
            
            if not source:
                raise HTTPException(status_code=404, detail=f"RSS source {source_id} not found")
            
            background_tasks.add_task(rss_processor.process_source, source_id)
        
        return {
            "message": f"Processing started for {len(request.source_ids)} RSS sources",
            "source_ids": request.source_ids
        }
    else:
        # Process all active sources
        background_tasks.add_task(rss_processor.process_all_feeds)
        return {"message": "Processing started for all active RSS sources"}

@router.get("/sources/{source_id}/items")
async def get_source_items(
    source_id: str,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get RSS items from a specific source"""
    
    # Verify source exists
    result = await db.execute(select(RSSSource).where(RSSSource.id == source_id))
    source = result.scalar_one_or_none()
    
    if not source:
        raise HTTPException(status_code=404, detail="RSS source not found")
    
    # Get items
    result = await db.execute(
        select(RSSItem)
        .where(RSSItem.source_id == source_id)
        .order_by(RSSItem.published_at.desc().nullslast(), RSSItem.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = result.scalars().all()
    
    return {
        "source": {
            "id": source.id,
            "name": source.name,
            "site_name": source.site_name
        },
        "items": [
            {
                "id": item.id,
                "title": item.title,
                "description": item.description,
                "url": item.url,
                "author": item.author,
                "published_at": item.published_at.isoformat() if item.published_at else None,
                "ai_summary": item.ai_summary,
                "ai_topic": item.ai_topic,
                "ai_subtopic": item.ai_subtopic,
                "ai_tags": item.ai_tags,
                "ai_sentiment": item.ai_sentiment,
                "ai_importance_score": item.ai_importance_score,
                "ai_processing_status": item.ai_processing_status,
                "is_read": item.is_read,
                "is_bookmarked": item.is_bookmarked,
                "created_at": item.created_at.isoformat()
            }
            for item in items
        ],
        "pagination": {
            "offset": offset,
            "limit": limit,
            "total": len(items)
        }
    }