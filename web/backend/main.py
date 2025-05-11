from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import os

from models import User, MindMap, Credit, Base
from database import engine, get_db
from schemas import UserCreate, UserResponse, MindMapCreate, MindMapResponse, CreditResponse
from auth import create_access_token, get_current_user, get_password_hash, verify_password

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LLM MindMap API", description="API for LLM MindMap Web Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "LLM MindMap API へようこそ"}

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="このメールアドレスは既に登録されています")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    
    initial_credit = Credit(amount=10, user=db_user)
    
    db.add(db_user)
    db.add(initial_credit)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/mindmaps/", response_model=MindMapResponse)
def create_mindmap(
    mindmap: MindMapCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_mindmap = MindMap(
        title=mindmap.title,
        data=mindmap.data,
        user_id=current_user.id
    )
    db.add(db_mindmap)
    db.commit()
    db.refresh(db_mindmap)
    return db_mindmap

@app.get("/mindmaps/", response_model=List[MindMapResponse])
def read_mindmaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    mindmaps = db.query(MindMap).filter(
        MindMap.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return mindmaps

@app.get("/mindmaps/{mindmap_id}", response_model=MindMapResponse)
def read_mindmap(
    mindmap_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mindmap = db.query(MindMap).filter(
        MindMap.id == mindmap_id, 
        MindMap.user_id == current_user.id
    ).first()
    
    if mindmap is None:
        raise HTTPException(status_code=404, detail="マインドマップが見つかりません")
    
    return mindmap

@app.put("/mindmaps/{mindmap_id}", response_model=MindMapResponse)
def update_mindmap(
    mindmap_id: int,
    mindmap_update: MindMapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_mindmap = db.query(MindMap).filter(
        MindMap.id == mindmap_id, 
        MindMap.user_id == current_user.id
    ).first()
    
    if db_mindmap is None:
        raise HTTPException(status_code=404, detail="マインドマップが見つかりません")
    
    db_mindmap.title = mindmap_update.title
    db_mindmap.data = mindmap_update.data
    db_mindmap.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_mindmap)
    return db_mindmap

@app.delete("/mindmaps/{mindmap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mindmap(
    mindmap_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_mindmap = db.query(MindMap).filter(
        MindMap.id == mindmap_id, 
        MindMap.user_id == current_user.id
    ).first()
    
    if db_mindmap is None:
        raise HTTPException(status_code=404, detail="マインドマップが見つかりません")
    
    db.delete(db_mindmap)
    db.commit()
    return None

@app.get("/credits/", response_model=CreditResponse)
def get_user_credits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    credit = db.query(Credit).filter(Credit.user_id == current_user.id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="クレジット情報が見つかりません")
    return credit

@app.post("/ai/chat")
async def ai_chat_proxy(
    request_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    credit = db.query(Credit).filter(Credit.user_id == current_user.id).first()
    if not credit or credit.amount <= 0:
        raise HTTPException(status_code=402, detail="クレジットが不足しています")
    
    credit.amount -= 1
    db.commit()
    
    
    return {
        "success": True,
        "response": "AIレスポンスがここに入ります",
        "remaining_credits": credit.amount
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
