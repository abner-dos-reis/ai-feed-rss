from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from database import get_db, Topic, RSSItem
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta

router = APIRouter()

class TopicStats(BaseModel):
    id: str
    name: str
    description: Optional[str]
    parent_topic_id: Optional[str]
    item_count: int
    recent_items: int  # Last 24 hours
    avg_importance: float
    sentiment_distribution: Dict[str, int]
    color: Optional[str]
    icon: Optional[str]
    is_ai_generated: bool

class TopicHierarchy(BaseModel):
    id: str
    name: str
    item_count: int
    children: List["TopicHierarchy"] = []

@router.get("/", response_model=List[TopicStats])
async def get_all_topics(
    include_empty: bool = False,
    min_items: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Obter todos os tópicos com estatísticas"""
    
    query = select(Topic)
    
    if not include_empty:
        query = query.where(Topic.item_count > min_items)
    
    result = await db.execute(query.order_by(desc(Topic.item_count), Topic.name))
    topics = result.scalars().all()
    
    topic_stats = []
    
    for topic in topics:
        # Get recent items count (last 24 hours)
        recent_query = select(func.count(RSSItem.id))
        
        if topic.parent_topic_id is None:
            # Main topic - count items from topic and subtopics
            recent_query = recent_query.where(
                and_(
                    RSSItem.ai_topic == topic.name,
                    RSSItem.created_at >= datetime.utcnow() - timedelta(days=1)
                )
            )
        else:
            # Subtopic
            recent_query = recent_query.where(
                and_(
                    RSSItem.ai_subtopic == topic.name,
                    RSSItem.created_at >= datetime.utcnow() - timedelta(days=1)
                )
            )
        
        recent_result = await db.execute(recent_query)
        recent_items = recent_result.scalar() or 0
        
        # Get average importance score
        importance_query = select(func.avg(RSSItem.ai_importance_score))
        
        if topic.parent_topic_id is None:
            importance_query = importance_query.where(RSSItem.ai_topic == topic.name)
        else:
            importance_query = importance_query.where(RSSItem.ai_subtopic == topic.name)
        
        importance_result = await db.execute(importance_query)
        avg_importance = importance_result.scalar() or 0.0
        
        # Get sentiment distribution
        sentiment_query = (
            select(RSSItem.ai_sentiment, func.count(RSSItem.id))
            .group_by(RSSItem.ai_sentiment)
        )
        
        if topic.parent_topic_id is None:
            sentiment_query = sentiment_query.where(RSSItem.ai_topic == topic.name)
        else:
            sentiment_query = sentiment_query.where(RSSItem.ai_subtopic == topic.name)
        
        sentiment_result = await db.execute(sentiment_query)
        sentiment_distribution = dict(sentiment_result.all())
        
        topic_stats.append(TopicStats(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            parent_topic_id=topic.parent_topic_id,
            item_count=topic.item_count,
            recent_items=recent_items,
            avg_importance=round(avg_importance, 3),
            sentiment_distribution=sentiment_distribution,
            color=topic.color,
            icon=topic.icon,
            is_ai_generated=topic.is_ai_generated
        ))
    
    return topic_stats

@router.get("/hierarchy", response_model=List[TopicHierarchy])
async def get_topic_hierarchy(db: AsyncSession = Depends(get_db)):
    """Obter hierarquia completa de tópicos"""
    
    # Get all topics
    result = await db.execute(select(Topic).order_by(Topic.name))
    all_topics = result.scalars().all()
    
    # Build hierarchy
    topics_dict = {topic.id: topic for topic in all_topics}
    hierarchy = []
    
    # Find root topics (no parent)
    for topic in all_topics:
        if topic.parent_topic_id is None:
            hierarchy.append(_build_topic_hierarchy(topic, topics_dict))
    
    return hierarchy

def _build_topic_hierarchy(topic: Topic, topics_dict: Dict[str, Topic]) -> TopicHierarchy:
    """Construir hierarquia recursivamente"""
    children = []
    
    # Find children
    for child_topic in topics_dict.values():
        if child_topic.parent_topic_id == topic.id:
            children.append(_build_topic_hierarchy(child_topic, topics_dict))
    
    return TopicHierarchy(
        id=topic.id,
        name=topic.name,
        item_count=topic.item_count,
        children=children
    )

@router.get("/trending")
async def get_trending_topics(
    days: int = 7,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Obter tópicos em alta (mais atividade recente)"""
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # Get topic activity in the specified period
    result = await db.execute(
        select(
            RSSItem.ai_topic,
            func.count(RSSItem.id).label("recent_count"),
            func.avg(RSSItem.ai_importance_score).label("avg_importance")
        )
        .where(
            and_(
                RSSItem.ai_topic.is_not(None),
                RSSItem.created_at >= since_date
            )
        )
        .group_by(RSSItem.ai_topic)
        .order_by(desc("recent_count"))
        .limit(limit)
    )
    
    trending = result.all()
    
    return [
        {
            "topic": topic_name,
            "recent_items": recent_count,
            "avg_importance": round(avg_importance or 0, 3),
            "trend_score": recent_count * (avg_importance or 0.5)
        }
        for topic_name, recent_count, avg_importance in trending
    ]

@router.get("/sentiment-analysis")
async def get_sentiment_analysis(
    topic: Optional[str] = None,
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """Análise de sentimento por tópico"""
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    query = (
        select(
            RSSItem.ai_topic,
            RSSItem.ai_sentiment,
            func.count(RSSItem.id).label("count"),
            func.avg(RSSItem.ai_importance_score).label("avg_importance")
        )
        .where(
            and_(
                RSSItem.ai_topic.is_not(None),
                RSSItem.ai_sentiment.is_not(None),
                RSSItem.created_at >= since_date
            )
        )
        .group_by(RSSItem.ai_topic, RSSItem.ai_sentiment)
        .order_by(RSSItem.ai_topic, RSSItem.ai_sentiment)
    )
    
    if topic:
        query = query.where(RSSItem.ai_topic.ilike(f"%{topic}%"))
    
    result = await db.execute(query)
    sentiment_data = result.all()
    
    # Organize by topic
    topics_sentiment = {}
    for topic_name, sentiment, count, avg_importance in sentiment_data:
        if topic_name not in topics_sentiment:
            topics_sentiment[topic_name] = {
                "positive": 0,
                "negative": 0,
                "neutral": 0,
                "avg_importance": 0,
                "total_items": 0
            }
        
        topics_sentiment[topic_name][sentiment or "neutral"] = count
        topics_sentiment[topic_name]["total_items"] += count
        topics_sentiment[topic_name]["avg_importance"] = avg_importance or 0
    
    # Calculate sentiment ratios
    for topic_data in topics_sentiment.values():
        total = topic_data["total_items"]
        if total > 0:
            topic_data["positive_ratio"] = topic_data["positive"] / total
            topic_data["negative_ratio"] = topic_data["negative"] / total
            topic_data["neutral_ratio"] = topic_data["neutral"] / total
        else:
            topic_data["positive_ratio"] = 0
            topic_data["negative_ratio"] = 0
            topic_data["neutral_ratio"] = 0
    
    return topics_sentiment

@router.get("/word-cloud")
async def get_topic_word_cloud(
    days: int = 30,
    min_frequency: int = 2,
    db: AsyncSession = Depends(get_db)
):
    """Dados para word cloud de tópicos"""
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # Get topic frequencies
    result = await db.execute(
        select(
            RSSItem.ai_topic,
            func.count(RSSItem.id).label("frequency"),
            func.avg(RSSItem.ai_importance_score).label("avg_importance")
        )
        .where(
            and_(
                RSSItem.ai_topic.is_not(None),
                RSSItem.created_at >= since_date
            )
        )
        .group_by(RSSItem.ai_topic)
        .having(func.count(RSSItem.id) >= min_frequency)
        .order_by(desc("frequency"))
    )
    
    topics = result.all()
    
    # Also get subtopics
    subtopic_result = await db.execute(
        select(
            RSSItem.ai_subtopic,
            func.count(RSSItem.id).label("frequency"),
            func.avg(RSSItem.ai_importance_score).label("avg_importance")
        )
        .where(
            and_(
                RSSItem.ai_subtopic.is_not(None),
                RSSItem.created_at >= since_date
            )
        )
        .group_by(RSSItem.ai_subtopic)
        .having(func.count(RSSItem.id) >= min_frequency)
        .order_by(desc("frequency"))
    )
    
    subtopics = subtopic_result.all()
    
    # Combine and format for word cloud
    word_cloud_data = []
    
    for topic, frequency, avg_importance in topics:
        word_cloud_data.append({
            "text": topic,
            "value": frequency,
            "weight": frequency * (avg_importance or 0.5),
            "type": "topic"
        })
    
    for subtopic, frequency, avg_importance in subtopics:
        word_cloud_data.append({
            "text": subtopic,
            "value": frequency,
            "weight": frequency * (avg_importance or 0.5) * 0.7,  # Subtopics have lower weight
            "type": "subtopic"
        })
    
    # Sort by weight
    word_cloud_data.sort(key=lambda x: x["weight"], reverse=True)
    
    return word_cloud_data[:100]  # Limit to top 100

@router.post("/{topic_id}/update-color")
async def update_topic_color(
    topic_id: str,
    color: str,
    db: AsyncSession = Depends(get_db)
):
    """Atualizar cor de um tópico"""
    
    result = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()
    
    if not topic:
        raise HTTPException(status_code=404, detail="Tópico não encontrado")
    
    # Validate color format (hex)
    if not color.startswith("#") or len(color) != 7:
        raise HTTPException(status_code=400, detail="Cor deve estar no formato #RRGGBB")
    
    topic.color = color
    await db.commit()
    
    return {"message": f"Cor do tópico '{topic.name}' atualizada"}

@router.post("/{topic_id}/update-icon")
async def update_topic_icon(
    topic_id: str,
    icon: str,
    db: AsyncSession = Depends(get_db)
):
    """Atualizar ícone de um tópico"""
    
    result = await db.execute(select(Topic).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()
    
    if not topic:
        raise HTTPException(status_code=404, detail="Tópico não encontrado")
    
    topic.icon = icon
    await db.commit()
    
    return {"message": f"Ícone do tópico '{topic.name}' atualizado"}