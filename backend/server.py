from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import base64
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'sua-chave-secreta-super-segura-aqui-12345')
ALGORITHM = "HS256"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nome: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    email: EmailStr
    senha: str
    nome: str

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    slug: str

class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    slug: str
    resumo: str
    conteudo: str
    imagem_url: str
    categoria_id: str
    categoria_nome: str
    autor_id: str
    autor_nome: str
    data_publicacao: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    ultima_atualizacao: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    destaque: bool = False
    visualizacoes: int = 0

class ArticleCreate(BaseModel):
    titulo: str
    resumo: str
    conteudo: str
    imagem_url: str
    categoria_id: str
    destaque: bool = False

class ArticleUpdate(BaseModel):
    titulo: Optional[str] = None
    resumo: Optional[str] = None
    conteudo: Optional[str] = None
    imagem_url: Optional[str] = None
    categoria_id: Optional[str] = None
    destaque: Optional[bool] = None

# Helper functions
def create_slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]', 'e', text)
    text = re.sub(r'[ìíîï]', 'i', text)
    text = re.sub(r'[òóôõö]', 'o', text)
    text = re.sub(r'[ùúûü]', 'u', text)
    text = re.sub(r'[ç]', 'c', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Auth endpoints
@api_router.post("/auth/register", response_model=User)
async def register(user_input: UserCreate):
    existing = await db.users.find_one({"email": user_input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        email=user_input.email,
        nome=user_input.nome
    )
    
    user_doc = user.model_dump()
    user_doc['password_hash'] = hash_password(user_input.senha)
    
    await db.users.insert_one(user_doc)
    return user

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not verify_password(credentials.senha, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    access_token = create_access_token(data={"sub": user_doc['id']})
    user = User(**{k: v for k, v in user_doc.items() if k != 'password_hash'})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Categories
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

# Articles
@api_router.post("/articles", response_model=Article)
async def create_article(article_input: ArticleCreate, current_user: User = Depends(get_current_user)):
    # Get category
    category = await db.categories.find_one({"id": article_input.categoria_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    article = Article(
        titulo=article_input.titulo,
        slug=create_slug(article_input.titulo),
        resumo=article_input.resumo,
        conteudo=article_input.conteudo,
        imagem_url=article_input.imagem_url,
        categoria_id=article_input.categoria_id,
        categoria_nome=category['nome'],
        autor_id=current_user.id,
        autor_nome=current_user.nome,
        destaque=article_input.destaque
    )
    
    await db.articles.insert_one(article.model_dump())
    return article

@api_router.get("/articles", response_model=List[Article])
async def get_articles(
    categoria_id: Optional[str] = None,
    destaque: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {}
    if categoria_id:
        query['categoria_id'] = categoria_id
    if destaque is not None:
        query['destaque'] = destaque
    
    articles = await db.articles.find(query, {"_id": 0}).sort("data_publicacao", -1).skip(skip).limit(limit).to_list(limit)
    return articles

@api_router.get("/articles/slug/{slug}", response_model=Article)
async def get_article_by_slug(slug: str):
    article = await db.articles.find_one({"slug": slug}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    
    # Increment views
    await db.articles.update_one(
        {"slug": slug},
        {"$inc": {"visualizacoes": 1}}
    )
    article['visualizacoes'] = article.get('visualizacoes', 0) + 1
    
    return article

@api_router.get("/articles/popular", response_model=List[Article])
async def get_popular_articles(limit: int = 5):
    articles = await db.articles.find({}, {"_id": 0}).sort("visualizacoes", -1).limit(limit).to_list(limit)
    return articles

@api_router.put("/articles/{article_id}", response_model=Article)
async def update_article(
    article_id: str,
    article_input: ArticleUpdate,
    current_user: User = Depends(get_current_user)
):
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    
    update_data = {k: v for k, v in article_input.model_dump().items() if v is not None}
    
    if 'titulo' in update_data:
        update_data['slug'] = create_slug(update_data['titulo'])
    
    if 'categoria_id' in update_data:
        category = await db.categories.find_one({"id": update_data['categoria_id']}, {"_id": 0})
        if category:
            update_data['categoria_nome'] = category['nome']
    
    update_data['ultima_atualizacao'] = datetime.now(timezone.utc).isoformat()
    
    await db.articles.update_one({"id": article_id}, {"$set": update_data})
    
    updated_article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    return updated_article

@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str, current_user: User = Depends(get_current_user)):
    result = await db.articles.delete_one({"id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    
    return {"message": "Artigo deletado com sucesso"}

@api_router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Read file content
    content = await file.read()
    
    # Convert to base64
    base64_image = base64.b64encode(content).decode('utf-8')
    
    # Determine mime type
    mime_type = file.content_type or 'image/jpeg'
    
    # Create data URL
    image_url = f"data:{mime_type};base64,{base64_image}"
    
    return {"image_url": image_url}

@api_router.get("/stats")
async def get_stats(current_user: User = Depends(get_current_user)):
    total_articles = await db.articles.count_documents({})
    total_views = await db.articles.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$visualizacoes"}}}
    ]).to_list(1)
    
    return {
        "total_articles": total_articles,
        "total_views": total_views[0]['total'] if total_views else 0
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Initialize categories if not exists
    count = await db.categories.count_documents({})
    if count == 0:
        categories = [
            {"id": str(uuid.uuid4()), "nome": "Política", "slug": "politica"},
            {"id": str(uuid.uuid4()), "nome": "Economia", "slug": "economia"},
            {"id": str(uuid.uuid4()), "nome": "Tecnologia", "slug": "tecnologia"},
            {"id": str(uuid.uuid4()), "nome": "Esportes", "slug": "esportes"},
            {"id": str(uuid.uuid4()), "nome": "Cultura", "slug": "cultura"},
        ]
        await db.categories.insert_many(categories)
        logger.info("Categorias inicializadas")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()