import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database import AsyncSessionLocal, RSSSource, RSSItem, Topic
import feedparser
import aiohttp
from urllib.parse import urlparse
import hashlib
from services.ai_manager import AIManager

logger = logging.getLogger(__name__)

class RSSProcessor:
    """Processador de feeds RSS com organização automática por IA"""
    
    def __init__(self):
        self.ai_manager = AIManager()
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={'User-Agent': 'AI-Feed-RSS/1.0'}
            )
        return self.session
    
    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()
        await self.ai_manager.close()
    
    def extract_site_name(self, url: str) -> str:
        """Extrair nome do site da URL"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove 'www.' if presente
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Pegar apenas o nome principal do domínio
            parts = domain.split('.')
            if len(parts) >= 2:
                return parts[-2].capitalize()
            
            return domain.capitalize()
        except:
            return "Unknown"
    
    def generate_item_guid(self, source_id: str, title: str, url: str) -> str:
        """Gerar GUID único para item RSS"""
        content = f"{source_id}:{title}:{url}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def fetch_rss_feed(self, url: str) -> Optional[dict]:
        """Buscar e parsear feed RSS"""
        try:
            session = await self.get_session()
            
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {await response.text()}")
                
                content = await response.text()
                
            # Parse RSS feed
            feed = feedparser.parse(content)
            
            if feed.bozo and not feed.entries:
                raise Exception(f"Feed inválido: {feed.bozo_exception}")
            
            return {
                "title": feed.feed.get("title", ""),
                "description": feed.feed.get("description", ""),
                "link": feed.feed.get("link", url),
                "entries": feed.entries
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar RSS {url}: {e}")
            raise
    
    async def process_source(self, source_id: str):
        """Processar um source RSS específico"""
        async with AsyncSessionLocal() as db:
            # Get source
            result = await db.execute(select(RSSSource).where(RSSSource.id == source_id))
            source = result.scalar_one_or_none()
            
            if not source or not source.is_active:
                logger.warning(f"Source {source_id} não encontrado ou inativo")
                return
            
            logger.info(f"Processando RSS source: {source.name} ({source.url})")
            
            try:
                # Fetch RSS feed
                feed_data = await self.fetch_rss_feed(source.url)
                
                # Update source info
                if not source.site_name:
                    source.site_name = self.extract_site_name(source.url)
                
                source.last_fetched = datetime.utcnow()
                source.last_error = None
                
                # Process each entry
                new_items = 0
                for entry in feed_data["entries"]:
                    try:
                        # Generate GUID
                        guid = entry.get("id") or self.generate_item_guid(
                            source_id, 
                            entry.get("title", ""), 
                            entry.get("link", "")
                        )
                        
                        # Check if item already exists
                        existing_result = await db.execute(
                            select(RSSItem).where(
                                RSSItem.source_id == source_id,
                                RSSItem.guid == guid
                            )
                        )
                        
                        if existing_result.scalar_one_or_none():
                            continue  # Item já existe
                        
                        # Parse published date
                        published_at = None
                        if hasattr(entry, 'published_parsed') and entry.published_parsed:
                            try:
                                published_at = datetime(*entry.published_parsed[:6])
                            except:
                                pass
                        
                        # Create new RSS item
                        new_item = RSSItem(
                            source_id=source_id,
                            title=entry.get("title", ""),
                            description=entry.get("summary", ""),
                            content=entry.get("content", [{}])[0].get("value", "") if entry.get("content") else "",
                            url=entry.get("link", ""),
                            guid=guid,
                            author=entry.get("author", ""),
                            published_at=published_at,
                            ai_processing_status="pending"
                        )
                        
                        db.add(new_item)
                        new_items += 1
                        
                    except Exception as e:
                        logger.error(f"Erro ao processar entry: {e}")
                        continue
                
                # Update total items count
                source.total_items += new_items
                
                await db.commit()
                logger.info(f"Processados {new_items} novos itens para {source.name}")
                
                # Process AI categorization for new items
                if new_items > 0:
                    await self.process_ai_categorization(source_id)
                
            except Exception as e:
                logger.error(f"Erro ao processar source {source.name}: {e}")
                source.last_error = str(e)
                await db.commit()
    
    async def process_ai_categorization(self, source_id: str):
        """Processar categorização AI para itens pendentes de um source"""
        async with AsyncSessionLocal() as db:
            # Get pending items
            result = await db.execute(
                select(RSSItem)
                .where(
                    RSSItem.source_id == source_id,
                    RSSItem.ai_processing_status == "pending"
                )
                .limit(10)  # Process in batches
            )
            
            pending_items = result.scalars().all()
            
            for item in pending_items:
                try:
                    # Update status to processing
                    item.ai_processing_status = "processing"
                    await db.commit()
                    
                    # Get AI categorization
                    categorization = await self.ai_manager.categorize_content(
                        item.title,
                        item.description or "",
                        item.content or ""
                    )
                    
                    # Update item with AI results
                    item.ai_summary = categorization.get("summary", "")
                    item.ai_topic = categorization.get("topic", "")
                    item.ai_subtopic = categorization.get("subtopic", "")
                    item.ai_tags = categorization.get("tags", [])
                    item.ai_sentiment = categorization.get("sentiment", "neutral")
                    item.ai_importance_score = categorization.get("importance_score", 0.5)
                    item.ai_processing_status = "completed"
                    item.ai_processed_at = datetime.utcnow()
                    item.ai_api_used = categorization.get("api_used", "")
                    
                    # Create/update topics
                    await self.ensure_topic_exists(item.ai_topic, item.ai_subtopic, db)
                    
                    await db.commit()
                    
                    logger.info(f"Item categorizado: {item.title[:50]}... -> {item.ai_topic}/{item.ai_subtopic}")
                    
                except Exception as e:
                    logger.error(f"Erro na categorização AI do item {item.id}: {e}")
                    item.ai_processing_status = "failed"
                    await db.commit()
    
    async def ensure_topic_exists(self, topic_name: str, subtopic_name: str, db: AsyncSession):
        """Garantir que tópico e subtópico existam no banco"""
        if not topic_name:
            return
        
        # Check if main topic exists
        topic_result = await db.execute(
            select(Topic).where(
                Topic.name == topic_name,
                Topic.parent_topic_id.is_(None)
            )
        )
        main_topic = topic_result.scalar_one_or_none()
        
        if not main_topic:
            main_topic = Topic(
                name=topic_name,
                description=f"Tópico gerado automaticamente pela IA",
                is_ai_generated=True
            )
            db.add(main_topic)
            await db.flush()  # Get the ID
        
        # Update topic item count
        main_topic.item_count += 1
        
        # Handle subtopic if provided
        if subtopic_name and subtopic_name != topic_name:
            subtopic_result = await db.execute(
                select(Topic).where(
                    Topic.name == subtopic_name,
                    Topic.parent_topic_id == main_topic.id
                )
            )
            subtopic = subtopic_result.scalar_one_or_none()
            
            if not subtopic:
                subtopic = Topic(
                    name=subtopic_name,
                    parent_topic_id=main_topic.id,
                    description=f"Subtópico de {topic_name} gerado pela IA",
                    is_ai_generated=True
                )
                db.add(subtopic)
                await db.flush()
            
            subtopic.item_count += 1
    
    async def process_all_feeds(self):
        """Processar todos os feeds RSS ativos"""
        async with AsyncSessionLocal() as db:
            # Get active sources that need processing
            now = datetime.utcnow()
            
            result = await db.execute(
                select(RSSSource)
                .where(
                    RSSSource.is_active == True,
                    (RSSSource.last_fetched.is_(None) | 
                     (RSSSource.last_fetched < now - timedelta(seconds=RSSSource.fetch_interval)))
                )
            )
            
            sources = result.scalars().all()
            logger.info(f"Processando {len(sources)} feeds RSS")
            
            # Process sources in parallel (but limited)
            semaphore = asyncio.Semaphore(3)  # Max 3 concurrent processing
            
            async def process_with_semaphore(source_id):
                async with semaphore:
                    await self.process_source(source_id)
            
            # Create tasks for all sources
            tasks = [process_with_semaphore(source.id) for source in sources]
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
            
            logger.info("Processamento de feeds RSS concluído")
    
    async def get_processing_stats(self) -> dict:
        """Obter estatísticas de processamento"""
        async with AsyncSessionLocal() as db:
            # Total sources
            sources_result = await db.execute(select(RSSSource))
            total_sources = len(sources_result.scalars().all())
            
            # Active sources
            active_result = await db.execute(select(RSSSource).where(RSSSource.is_active == True))
            active_sources = len(active_result.scalars().all())
            
            # Total items
            items_result = await db.execute(select(RSSItem))
            total_items = len(items_result.scalars().all())
            
            # Processed items
            processed_result = await db.execute(
                select(RSSItem).where(RSSItem.ai_processing_status == "completed")
            )
            processed_items = len(processed_result.scalars().all())
            
            # Pending items
            pending_result = await db.execute(
                select(RSSItem).where(RSSItem.ai_processing_status == "pending")
            )
            pending_items = len(pending_result.scalars().all())
            
            return {
                "total_sources": total_sources,
                "active_sources": active_sources,
                "total_items": total_items,
                "processed_items": processed_items,
                "pending_items": pending_items,
                "processing_rate": processed_items / total_items if total_items > 0 else 0
            }