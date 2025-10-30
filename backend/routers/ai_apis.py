from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from database import get_db, AIApiProvider
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from services.ai_manager import AIManager
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class AIApiCreate(BaseModel):
    name: str = Field(..., description="Nome da API (ex: OpenAI GPT-4)")
    api_type: str = Field(..., description="Tipo da API: openai, huggingface, anthropic, groq, etc")
    api_key: str = Field(..., description="Chave da API")
    base_url: Optional[str] = Field(None, description="URL base customizada (opcional)")
    model_name: str = Field(..., description="Nome do modelo (ex: gpt-4, claude-3, etc)")
    priority: int = Field(1, description="Prioridade (1=mais alta, números maiores=menor prioridade)")
    max_requests_per_minute: int = Field(60, description="Limite de requests por minuto")
    config: Optional[Dict[str, Any]] = Field(None, description="Configurações adicionais do modelo")

class AIApiUpdate(BaseModel):
    name: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: Optional[str] = None
    priority: Optional[int] = None
    max_requests_per_minute: Optional[int] = None
    is_active: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None

class AIApiResponse(BaseModel):
    id: str
    name: str
    api_type: str
    base_url: Optional[str]
    model_name: str
    priority: int
    is_active: bool
    max_requests_per_minute: int
    current_requests: int
    success_rate: float
    total_requests: int
    failed_requests: int
    config: Optional[Dict[str, Any]]
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[AIApiResponse])
async def get_ai_apis(db: AsyncSession = Depends(get_db)):
    """Listar todas as APIs de IA configuradas"""
    result = await db.execute(
        select(AIApiProvider).order_by(AIApiProvider.priority, AIApiProvider.created_at)
    )
    apis = result.scalars().all()
    
    return [AIApiResponse(
        id=api.id,
        name=api.name,
        api_type=api.api_type,
        base_url=api.base_url,
        model_name=api.model_name,
        priority=api.priority,
        is_active=api.is_active,
        max_requests_per_minute=api.max_requests_per_minute,
        current_requests=api.current_requests,
        success_rate=api.success_rate,
        total_requests=api.total_requests,
        failed_requests=api.failed_requests,
        config=api.config,
        created_at=api.created_at.isoformat(),
        updated_at=api.updated_at.isoformat()
    ) for api in apis]

@router.post("/", response_model=AIApiResponse)
async def add_ai_api(api_data: AIApiCreate, db: AsyncSession = Depends(get_db)):
    """Adicionar nova API de IA"""
    
    # Check if name already exists
    result = await db.execute(select(AIApiProvider).where(AIApiProvider.name == api_data.name))
    existing_api = result.scalar_one_or_none()
    
    if existing_api:
        raise HTTPException(status_code=400, detail="API com este nome já existe")
    
    # Create new AI API
    new_api = AIApiProvider(
        name=api_data.name,
        api_type=api_data.api_type,
        api_key=api_data.api_key,
        base_url=api_data.base_url,
        model_name=api_data.model_name,
        priority=api_data.priority,
        max_requests_per_minute=api_data.max_requests_per_minute,
        config=api_data.config
    )
    
    db.add(new_api)
    await db.commit()
    await db.refresh(new_api)
    
    # Test the API
    ai_manager = AIManager()
    try:
        test_result = await ai_manager.test_api(new_api.id)
        logger.info(f"API {new_api.name} tested successfully: {test_result}")
    except Exception as e:
        logger.warning(f"API {new_api.name} test failed: {e}")
    
    return AIApiResponse(
        id=new_api.id,
        name=new_api.name,
        api_type=new_api.api_type,
        base_url=new_api.base_url,
        model_name=new_api.model_name,
        priority=new_api.priority,
        is_active=new_api.is_active,
        max_requests_per_minute=new_api.max_requests_per_minute,
        current_requests=new_api.current_requests,
        success_rate=new_api.success_rate,
        total_requests=new_api.total_requests,
        failed_requests=new_api.failed_requests,
        config=new_api.config,
        created_at=new_api.created_at.isoformat(),
        updated_at=new_api.updated_at.isoformat()
    )

@router.put("/{api_id}", response_model=AIApiResponse)
async def update_ai_api(
    api_id: str, 
    api_data: AIApiUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """Atualizar API de IA existente"""
    
    result = await db.execute(select(AIApiProvider).where(AIApiProvider.id == api_id))
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(status_code=404, detail="API não encontrada")
    
    # Update fields
    update_data = api_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(api, field, value)
    
    await db.commit()
    await db.refresh(api)
    
    return AIApiResponse(
        id=api.id,
        name=api.name,
        api_type=api.api_type,
        base_url=api.base_url,
        model_name=api.model_name,
        priority=api.priority,
        is_active=api.is_active,
        max_requests_per_minute=api.max_requests_per_minute,
        current_requests=api.current_requests,
        success_rate=api.success_rate,
        total_requests=api.total_requests,
        failed_requests=api.failed_requests,
        config=api.config,
        created_at=api.created_at.isoformat(),
        updated_at=api.updated_at.isoformat()
    )

@router.delete("/{api_id}")
async def delete_ai_api(api_id: str, db: AsyncSession = Depends(get_db)):
    """Deletar API de IA"""
    
    result = await db.execute(select(AIApiProvider).where(AIApiProvider.id == api_id))
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(status_code=404, detail="API não encontrada")
    
    await db.execute(delete(AIApiProvider).where(AIApiProvider.id == api_id))
    await db.commit()
    
    return {"message": f"API '{api.name}' deletada com sucesso"}

@router.post("/{api_id}/toggle")
async def toggle_ai_api(api_id: str, db: AsyncSession = Depends(get_db)):
    """Ativar/desativar API de IA"""
    
    result = await db.execute(select(AIApiProvider).where(AIApiProvider.id == api_id))
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(status_code=404, detail="API não encontrada")
    
    api.is_active = not api.is_active
    await db.commit()
    
    status = "ativada" if api.is_active else "desativada"
    return {"message": f"API '{api.name}' {status}"}

@router.post("/{api_id}/test")
async def test_ai_api(api_id: str, db: AsyncSession = Depends(get_db)):
    """Testar API de IA"""
    
    result = await db.execute(select(AIApiProvider).where(AIApiProvider.id == api_id))
    api = result.scalar_one_or_none()
    
    if not api:
        raise HTTPException(status_code=404, detail="API não encontrada")
    
    ai_manager = AIManager()
    try:
        test_result = await ai_manager.test_api(api_id)
        return {
            "success": True,
            "message": "API testada com sucesso",
            "response": test_result,
            "api_name": api.name
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Falha no teste da API: {str(e)}",
            "api_name": api.name
        }

@router.get("/status")
async def get_apis_status(db: AsyncSession = Depends(get_db)):
    """Obter status de todas as APIs"""
    
    result = await db.execute(select(AIApiProvider))
    apis = result.scalars().all()
    
    total_apis = len(apis)
    active_apis = sum(1 for api in apis if api.is_active)
    
    # Calculate overall success rate
    total_requests = sum(api.total_requests for api in apis)
    total_failed = sum(api.failed_requests for api in apis)
    overall_success_rate = (total_requests - total_failed) / total_requests if total_requests > 0 else 1.0
    
    return {
        "total_apis": total_apis,
        "active_apis": active_apis,
        "inactive_apis": total_apis - active_apis,
        "overall_success_rate": round(overall_success_rate, 3),
        "total_requests": total_requests,
        "total_failed_requests": total_failed,
        "apis": [
            {
                "id": api.id,
                "name": api.name,
                "api_type": api.api_type,
                "is_active": api.is_active,
                "success_rate": api.success_rate,
                "priority": api.priority
            }
            for api in sorted(apis, key=lambda x: x.priority)
        ]
    }