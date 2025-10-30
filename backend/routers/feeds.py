from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from database import get_db, RSSItem, RSSSource, Topic
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

router = APIRouter()

class FeedItemResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    url: str
    author: Optional[str]
    published_at: Optional[str]
    ai_summary: Optional[str]
    ai_topic: Optional[str]
    ai_subtopic: Optional[str]
    ai_tags: Optional[List[str]]
    ai_sentiment: Optional[str]
    ai_importance_score: Optional[float]
    is_read: bool
    is_bookmarked: bool
    source_name: str
    site_name: Optional[str]
    created_at: str

class TopicResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    parent_topic_id: Optional[str]
    color: Optional[str]
    icon: Optional[str]
    item_count: int
    subtopics: List["TopicResponse"] = []

class SiteResponse(BaseModel):
    site_name: str
    source_count: int
    total_items: int
    recent_items: int
    last_updated: Optional[str]

# Modo 1: Visualização por Tópicos e Subtópicos
@router.get("/by-topics", response_model=List[TopicResponse])
async def get_feeds_by_topics(
    include_empty: bool = Query(False, description="Incluir tópicos sem itens"),
    db: AsyncSession = Depends(get_db)
):
    """Visualização organizada por tópicos e subtópicos gerados pela IA"""
    
    # Get main topics (without parent)
    main_topics_result = await db.execute(
        select(Topic)
        .where(Topic.parent_topic_id.is_(None))
        .order_by(desc(Topic.item_count), Topic.name)
    )
    main_topics = main_topics_result.scalars().all()
    
    response = []
    
    for topic in main_topics:
        if not include_empty and topic.item_count == 0:
            continue
            
        # Get subtopics
        subtopics_result = await db.execute(
            select(Topic)
            .where(Topic.parent_topic_id == topic.id)
            .order_by(desc(Topic.item_count), Topic.name)
        )
        subtopics = subtopics_result.scalars().all()
        
        subtopics_list = []
        for subtopic in subtopics:
            if not include_empty and subtopic.item_count == 0:
                continue
                
            subtopics_list.append(TopicResponse(
                id=subtopic.id,
                name=subtopic.name,
                description=subtopic.description,
                parent_topic_id=subtopic.parent_topic_id,
                color=subtopic.color,
                icon=subtopic.icon,
                item_count=subtopic.item_count,
                subtopics=[]
            ))
        
        response.append(TopicResponse(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            parent_topic_id=topic.parent_topic_id,
            color=topic.color,
            icon=topic.icon,
            item_count=topic.item_count,
            subtopics=subtopics_list
        ))
    
    return response

@router.get("/by-topics/{topic_id}/items", response_model=List[FeedItemResponse])
async def get_topic_items(
    topic_id: str,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    sentiment: Optional[str] = Query(None, regex="^(positive|negative|neutral)$"),
    min_importance: Optional[float] = Query(None, ge=0.0, le=1.0),
    db: AsyncSession = Depends(get_db)
):
    """Obter itens de um tópico específico"""
    
    # Verify topic exists
    topic_result = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = topic_result.scalar_one_or_none()
    
    if not topic:
        raise HTTPException(status_code=404, detail="Tópico não encontrado")
    
    # Build query
    query = (
        select(RSSItem, RSSSource.name.label("source_name"), RSSSource.site_name)
        .join(RSSSource, RSSItem.source_id == RSSSource.id)
    )
    
    # Filter by topic or subtopic
    if topic.parent_topic_id is None:
        # Main topic - include items from this topic and its subtopics
        query = query.where(
            or_(
                RSSItem.ai_topic == topic.name,
                RSSItem.ai_subtopic == topic.name
            )
        )
    else:
        # Subtopic - only items from this subtopic
        query = query.where(RSSItem.ai_subtopic == topic.name)
    
    # Apply filters
    if sentiment:
        query = query.where(RSSItem.ai_sentiment == sentiment)
    
    if min_importance is not None:
        query = query.where(RSSItem.ai_importance_score >= min_importance)
    
    # Order and paginate
    query = (
        query
        .order_by(desc(RSSItem.ai_importance_score), desc(RSSItem.published_at), desc(RSSItem.created_at))
        .offset(offset)
        .limit(limit)
    )
    
    result = await db.execute(query)
    items_with_sources = result.all()
    
    return [
        FeedItemResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            url=item.url,
            author=item.author,
            published_at=item.published_at.isoformat() if item.published_at else None,
            ai_summary=item.ai_summary,
            ai_topic=item.ai_topic,
            ai_subtopic=item.ai_subtopic,
            ai_tags=item.ai_tags,
            ai_sentiment=item.ai_sentiment,
            ai_importance_score=item.ai_importance_score,
            is_read=item.is_read,
            is_bookmarked=item.is_bookmarked,
            source_name=source_name,
            site_name=site_name,
            created_at=item.created_at.isoformat()
        )
        for item, source_name, site_name in items_with_sources
    ]

# Modo 2: Visualização por Site
@router.get("/by-sites", response_model=List[SiteResponse])
async def get_feeds_by_sites(db: AsyncSession = Depends(get_db)):
    """Visualização organizada por site/fonte"""
    
    # Get site statistics
    result = await db.execute(
        select(
            RSSSource.site_name,
            func.count(RSSSource.id).label("source_count"),
            func.sum(RSSSource.total_items).label("total_items"),
            func.max(RSSSource.last_fetched).label("last_updated")
        )
        .where(RSSSource.site_name.is_not(None))
        .group_by(RSSSource.site_name)
        .order_by(desc("total_items"))
    )
    
    sites_data = result.all()
    response = []
    
    for site_name, source_count, total_items, last_updated in sites_data:
        # Count recent items (last 24 hours)
        recent_result = await db.execute(
            select(func.count(RSSItem.id))
            .join(RSSSource, RSSItem.source_id == RSSSource.id)
            .where(
                and_(
                    RSSSource.site_name == site_name,
                    RSSItem.created_at >= datetime.utcnow() - timedelta(days=1)
                )
            )
        )
        recent_items = recent_result.scalar() or 0
        
        response.append(SiteResponse(
            site_name=site_name,
            source_count=source_count,
            total_items=total_items or 0,
            recent_items=recent_items,
            last_updated=last_updated.isoformat() if last_updated else None
        ))
    
    return response

@router.get("/by-sites/{site_name}/items", response_model=List[FeedItemResponse])
async def get_site_items(
    site_name: str,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    source_id: Optional[str] = Query(None, description="Filtrar por source específico"),
    db: AsyncSession = Depends(get_db)
):
    """Obter itens de um site específico"""
    
    # Build query
    query = (
        select(RSSItem, RSSSource.name.label("source_name"), RSSSource.site_name)
        .join(RSSSource, RSSItem.source_id == RSSSource.id)
        .where(RSSSource.site_name == site_name)
    )
    
    # Filter by specific source if provided
    if source_id:
        query = query.where(RSSSource.id == source_id)
    
    # Order and paginate
    query = (
        query
        .order_by(desc(RSSItem.published_at), desc(RSSItem.created_at))
        .offset(offset)
        .limit(limit)
    )
    
    result = await db.execute(query)
    items_with_sources = result.all()
    
    return [
        FeedItemResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            url=item.url,
            author=item.author,
            published_at=item.published_at.isoformat() if item.published_at else None,
            ai_summary=item.ai_summary,
            ai_topic=item.ai_topic,
            ai_subtopic=item.ai_subtopic,
            ai_tags=item.ai_tags,
            ai_sentiment=item.ai_sentiment,
            ai_importance_score=item.ai_importance_score,
            is_read=item.is_read,
            is_bookmarked=item.is_bookmarked,
            source_name=source_name,
            site_name=site_name,
            created_at=item.created_at.isoformat()
        )
        for item, source_name, site_name in items_with_sources
    ]

@router.get("/by-sites/{site_name}/sources")
async def get_site_sources(site_name: str, db: AsyncSession = Depends(get_db)):
    """Obter sources de um site específico"""
    
    result = await db.execute(
        select(RSSSource)
        .where(RSSSource.site_name == site_name)
        .order_by(RSSSource.name)
    )
    sources = result.scalars().all()
    
    return [
        {
            "id": source.id,
            "name": source.name,
            "url": source.url,
            "description": source.description,
            "total_items": source.total_items,
            "is_active": source.is_active,
            "last_fetched": source.last_fetched.isoformat() if source.last_fetched else None
        }
        for source in sources
    ]

# Modo 3: Lista Geral (Timeline)
@router.get("/timeline", response_model=List[FeedItemResponse])
async def get_feeds_timeline(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    topic: Optional[str] = Query(None, description="Filtrar por tópico"),
    site: Optional[str] = Query(None, description="Filtrar por site"),
    sentiment: Optional[str] = Query(None, regex="^(positive|negative|neutral)$"),
    min_importance: Optional[float] = Query(None, ge=0.0, le=1.0),
    unread_only: bool = Query(False, description="Apenas itens não lidos"),
    bookmarked_only: bool = Query(False, description="Apenas itens marcados"),
    db: AsyncSession = Depends(get_db)
):
    """Timeline geral de feeds com filtros opcionais"""
    
    # Build query
    query = (
        select(RSSItem, RSSSource.name.label("source_name"), RSSSource.site_name)
        .join(RSSSource, RSSItem.source_id == RSSSource.id)
    )
    
    # Apply filters
    if topic:
        query = query.where(
            or_(
                RSSItem.ai_topic.ilike(f"%{topic}%"),
                RSSItem.ai_subtopic.ilike(f"%{topic}%")
            )
        )
    
    if site:
        query = query.where(RSSSource.site_name.ilike(f"%{site}%"))
    
    if sentiment:
        query = query.where(RSSItem.ai_sentiment == sentiment)
    
    if min_importance is not None:
        query = query.where(RSSItem.ai_importance_score >= min_importance)
    
    if unread_only:
        query = query.where(RSSItem.is_read == False)
    
    if bookmarked_only:
        query = query.where(RSSItem.is_bookmarked == True)
    
    # Order by importance and recency
    query = (
        query
        .order_by(
            desc(RSSItem.ai_importance_score),
            desc(RSSItem.published_at),
            desc(RSSItem.created_at)
        )
        .offset(offset)
        .limit(limit)
    )
    
    result = await db.execute(query)
    items_with_sources = result.all()
    
    return [
        FeedItemResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            url=item.url,
            author=item.author,
            published_at=item.published_at.isoformat() if item.published_at else None,
            ai_summary=item.ai_summary,
            ai_topic=item.ai_topic,
            ai_subtopic=item.ai_subtopic,
            ai_tags=item.ai_tags,
            ai_sentiment=item.ai_sentiment,
            ai_importance_score=item.ai_importance_score,
            is_read=item.is_read,
            is_bookmarked=item.is_bookmarked,
            source_name=source_name,
            site_name=site_name,
            created_at=item.created_at.isoformat()
        )
        for item, source_name, site_name in items_with_sources
    ]

# Actions for items
@router.post("/items/{item_id}/mark-read")
async def mark_item_read(item_id: str, db: AsyncSession = Depends(get_db)):
    """Marcar item como lido"""
    
    result = await db.execute(select(RSSItem).where(RSSItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    item.is_read = True
    await db.commit()
    
    return {"message": "Item marcado como lido"}

@router.post("/items/{item_id}/bookmark")
async def toggle_bookmark(item_id: str, db: AsyncSession = Depends(get_db)):
    """Alternar bookmark do item"""
    
    result = await db.execute(select(RSSItem).where(RSSItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    item.is_bookmarked = not item.is_bookmarked
    await db.commit()
    
    status = "adicionado aos" if item.is_bookmarked else "removido dos"
    return {"message": f"Item {status} favoritos"}

@router.get("/stats")
async def get_feed_stats(db: AsyncSession = Depends(get_db)):
    """Estatísticas gerais dos feeds"""
    
    # Total items
    total_result = await db.execute(select(func.count(RSSItem.id)))
    total_items = total_result.scalar()
    
    # By sentiment
    sentiment_result = await db.execute(
        select(RSSItem.ai_sentiment, func.count(RSSItem.id))
        .group_by(RSSItem.ai_sentiment)
    )
    sentiment_counts = dict(sentiment_result.all())
    
    # Top topics
    topic_result = await db.execute(
        select(RSSItem.ai_topic, func.count(RSSItem.id))
        .where(RSSItem.ai_topic.is_not(None))
        .group_by(RSSItem.ai_topic)
        .order_by(desc(func.count(RSSItem.id)))
        .limit(10)
    )
    top_topics = dict(topic_result.all())
    
    # Recent activity (last 24 hours)
    recent_result = await db.execute(
        select(func.count(RSSItem.id))
        .where(RSSItem.created_at >= datetime.utcnow() - timedelta(days=1))
    )
    recent_items = recent_result.scalar()
    
    return {
        "total_items": total_items,
        "recent_items_24h": recent_items,
        "sentiment_distribution": sentiment_counts,
        "top_topics": top_topics,
        "processing_stats": {
            "completed": sentiment_counts.get("positive", 0) + sentiment_counts.get("negative", 0) + sentiment_counts.get("neutral", 0),
            "total": total_items
        }
    }