from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MindMapBase(BaseModel):
    title: str
    data: Dict[str, Any]

class MindMapCreate(MindMapBase):
    pass

class MindMapResponse(MindMapBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CreditBase(BaseModel):
    amount: int

class CreditCreate(CreditBase):
    pass

class CreditResponse(CreditBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AIRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
