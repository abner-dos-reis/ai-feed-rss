import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database import AsyncSessionLocal, AIApiProvider
import aiohttp
import openai
from transformers import pipeline
import random

logger = logging.getLogger(__name__)

class AIManager:
    """Gerenciador de múltiplas APIs de IA com sistema de fallback automático"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.rate_limit_reset_time = {}
        
    async def get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def get_available_apis(self) -> List[AIApiProvider]:
        """Obter APIs disponíveis ordenadas por prioridade e taxa de sucesso"""
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AIApiProvider)
                .where(AIApiProvider.is_active == True)
                .order_by(AIApiProvider.priority, AIApiProvider.success_rate.desc())
            )
            return result.scalars().all()
    
    async def can_make_request(self, api: AIApiProvider) -> bool:
        """Verificar se a API pode fazer uma requisição (rate limiting)"""
        now = datetime.utcnow()
        
        # Reset rate limit counter if minute has passed
        if api.last_request_time and (now - api.last_request_time).total_seconds() >= 60:
            async with AsyncSessionLocal() as db:
                await db.execute(
                    update(AIApiProvider)
                    .where(AIApiProvider.id == api.id)
                    .values(current_requests=0, last_request_time=now)
                )
                await db.commit()
            api.current_requests = 0
            api.last_request_time = now
        
        return api.current_requests < api.max_requests_per_minute
    
    async def update_api_stats(self, api_id: str, success: bool):
        """Atualizar estatísticas da API após uma requisição"""
        async with AsyncSessionLocal() as db:
            api_result = await db.execute(select(AIApiProvider).where(AIApiProvider.id == api_id))
            api = api_result.scalar_one_or_none()
            
            if api:
                api.total_requests += 1
                api.current_requests += 1
                api.last_request_time = datetime.utcnow()
                
                if not success:
                    api.failed_requests += 1
                
                # Recalculate success rate
                api.success_rate = (api.total_requests - api.failed_requests) / api.total_requests
                
                await db.commit()
    
    async def call_openai_api(self, api: AIApiProvider, prompt: str) -> str:
        """Chamar API da OpenAI"""
        try:
            client = openai.AsyncOpenAI(
                api_key=api.api_key,
                base_url=api.base_url
            )
            
            response = await client.chat.completions.create(
                model=api.model_name,
                messages=[
                    {"role": "system", "content": "Você é um assistente especializado em análise e categorização de conteúdo RSS. Seja preciso e conciso."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=api.config.get("max_tokens", 500) if api.config else 500,
                temperature=api.config.get("temperature", 0.7) if api.config else 0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def call_huggingface_api(self, api: AIApiProvider, prompt: str) -> str:
        """Chamar API da Hugging Face"""
        try:
            session = await self.get_session()
            headers = {"Authorization": f"Bearer {api.api_key}"}
            
            base_url = api.base_url or "https://api-inference.huggingface.co"
            url = f"{base_url}/models/{api.model_name}"
            
            payload = {
                "inputs": prompt,
                "parameters": api.config or {}
            }
            
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    if isinstance(result, list) and len(result) > 0:
                        return result[0].get("generated_text", "").strip()
                    return str(result)
                else:
                    error_text = await response.text()
                    raise Exception(f"HuggingFace API error: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"HuggingFace API error: {e}")
            raise
    
    async def call_anthropic_api(self, api: AIApiProvider, prompt: str) -> str:
        """Chamar API da Anthropic (Claude)"""
        try:
            session = await self.get_session()
            headers = {
                "x-api-key": api.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            base_url = api.base_url or "https://api.anthropic.com"
            url = f"{base_url}/v1/messages"
            
            payload = {
                "model": api.model_name,
                "max_tokens": api.config.get("max_tokens", 500) if api.config else 500,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result["content"][0]["text"].strip()
                else:
                    error_text = await response.text()
                    raise Exception(f"Anthropic API error: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    async def call_groq_api(self, api: AIApiProvider, prompt: str) -> str:
        """Chamar API da Groq"""
        try:
            session = await self.get_session()
            headers = {
                "Authorization": f"Bearer {api.api_key}",
                "Content-Type": "application/json"
            }
            
            base_url = api.base_url or "https://api.groq.com/openai/v1"
            url = f"{base_url}/chat/completions"
            
            payload = {
                "model": api.model_name,
                "messages": [
                    {"role": "system", "content": "Você é um assistente especializado em análise de conteúdo."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": api.config.get("max_tokens", 500) if api.config else 500,
                "temperature": api.config.get("temperature", 0.7) if api.config else 0.7
            }
            
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result["choices"][0]["message"]["content"].strip()
                else:
                    error_text = await response.text()
                    raise Exception(f"Groq API error: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise
    
    async def call_api(self, api: AIApiProvider, prompt: str) -> str:
        """Chamar API específica baseada no tipo"""
        if api.api_type.lower() == "openai":
            return await self.call_openai_api(api, prompt)
        elif api.api_type.lower() == "huggingface":
            return await self.call_huggingface_api(api, prompt)
        elif api.api_type.lower() == "anthropic":
            return await self.call_anthropic_api(api, prompt)
        elif api.api_type.lower() == "groq":
            return await self.call_groq_api(api, prompt)
        else:
            raise Exception(f"Tipo de API não suportado: {api.api_type}")
    
    async def generate_with_fallback(self, prompt: str, max_retries: int = 3) -> Dict[str, Any]:
        """Gerar resposta com sistema de fallback automático"""
        apis = await self.get_available_apis()
        
        if not apis:
            raise Exception("Nenhuma API de IA disponível")
        
        last_error = None
        
        for attempt in range(max_retries):
            for api in apis:
                try:
                    # Check rate limiting
                    if not await self.can_make_request(api):
                        logger.warning(f"Rate limit exceeded for API {api.name}, skipping...")
                        continue
                    
                    logger.info(f"Tentando API {api.name} (tentativa {attempt + 1})")
                    
                    # Make the API call
                    response = await self.call_api(api, prompt)
                    
                    # Update success stats
                    await self.update_api_stats(api.id, True)
                    
                    return {
                        "success": True,
                        "response": response,
                        "api_used": api.name,
                        "api_id": api.id,
                        "attempt": attempt + 1
                    }
                    
                except Exception as e:
                    last_error = e
                    logger.error(f"API {api.name} failed: {e}")
                    
                    # Update failure stats
                    await self.update_api_stats(api.id, False)
                    
                    # Continue to next API
                    continue
            
            # Wait before retrying if all APIs failed
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception(f"Todas as APIs falharam após {max_retries} tentativas. Último erro: {last_error}")
    
    async def test_api(self, api_id: str) -> str:
        """Testar uma API específica"""
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(AIApiProvider).where(AIApiProvider.id == api_id))
            api = result.scalar_one_or_none()
            
            if not api:
                raise Exception("API não encontrada")
            
            test_prompt = "Responda apenas com 'OK' se você conseguir me entender."
            
            try:
                response = await self.call_api(api, test_prompt)
                await self.update_api_stats(api_id, True)
                return response
            except Exception as e:
                await self.update_api_stats(api_id, False)
                raise
    
    async def categorize_content(self, title: str, description: str, content: str = "") -> Dict[str, Any]:
        """Categorizar conteúdo RSS usando IA"""
        prompt = f"""
        Analise o seguinte conteúdo RSS e forneça uma categorização estruturada:

        TÍTULO: {title}
        DESCRIÇÃO: {description}
        CONTEÚDO: {content[:500]}...

        Responda APENAS com um JSON válido neste formato:
        {{
            "topic": "tópico principal",
            "subtopic": "subtópico específico",
            "tags": ["tag1", "tag2", "tag3"],
            "sentiment": "positive/negative/neutral",
            "importance_score": 0.8,
            "summary": "resumo em 2-3 frases"
        }}
        """
        
        result = await self.generate_with_fallback(prompt)
        
        try:
            # Parse JSON response
            content_analysis = json.loads(result["response"])
            content_analysis["api_used"] = result["api_used"]
            return content_analysis
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "topic": "Geral",
                "subtopic": "Não categorizado",
                "tags": ["rss", "feed"],
                "sentiment": "neutral",
                "importance_score": 0.5,
                "summary": description[:200] + "..." if len(description) > 200 else description,
                "api_used": result["api_used"]
            }