from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, Boolean, DateTime, Integer, Float, JSON, ForeignKey
from datetime import datetime
from typing import List, Optional, Dict, Any
import os
from uuid import uuid4
import uuid

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres123@database:5432/ai_feed_rss")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_size=10,
    max_overflow=20
)

# Create session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

# Models
class AIApiProvider(Base):
    __tablename__ = "ai_api_providers"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    api_type: Mapped[str] = mapped_column(String(50), nullable=False)  # openai, huggingface, anthropic, etc
    api_key: Mapped[str] = mapped_column(String(500), nullable=False)
    base_url: Mapped[Optional[str]] = mapped_column(String(500))
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=1)  # Lower number = higher priority
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    max_requests_per_minute: Mapped[int] = mapped_column(Integer, default=60)
    current_requests: Mapped[int] = mapped_column(Integer, default=0)
    last_request_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    success_rate: Mapped[float] = mapped_column(Float, default=1.0)
    total_requests: Mapped[int] = mapped_column(Integer, default=0)
    failed_requests: Mapped[int] = mapped_column(Integer, default=0)
    config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RSSSource(Base):
    __tablename__ = "rss_sources"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    source_type: Mapped[str] = mapped_column(String(50), default="web")
    site_name: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    fetch_interval: Mapped[int] = mapped_column(Integer, default=3600)  # seconds
    last_fetched: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_error: Mapped[Optional[str]] = mapped_column(Text)
    total_items: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RSSItem(Base):
    __tablename__ = "rss_items"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    source_id: Mapped[str] = mapped_column(String, ForeignKey("rss_sources.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    content: Mapped[Optional[str]] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    guid: Mapped[Optional[str]] = mapped_column(String(500))
    author: Mapped[Optional[str]] = mapped_column(String(255))
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # AI-generated fields
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    ai_topic: Mapped[Optional[str]] = mapped_column(String(100))
    ai_subtopic: Mapped[Optional[str]] = mapped_column(String(100))
    ai_tags: Mapped[Optional[List[str]]] = mapped_column(JSON)
    ai_sentiment: Mapped[Optional[str]] = mapped_column(String(20))  # positive, negative, neutral
    ai_importance_score: Mapped[Optional[float]] = mapped_column(Float)  # 0.0 to 1.0
    ai_processing_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, processing, completed, failed
    ai_processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    ai_api_used: Mapped[Optional[str]] = mapped_column(String(100))
    
    # User interaction
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_bookmarked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Topic(Base):
    __tablename__ = "topics"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    parent_topic_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("topics.id", ondelete="CASCADE"))
    color: Mapped[Optional[str]] = mapped_column(String(7))  # hex color
    icon: Mapped[Optional[str]] = mapped_column(String(50))
    item_count: Mapped[int] = mapped_column(Integer, default=0)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Dependency to get database session
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Initialize database
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)