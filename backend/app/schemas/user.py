from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    """Roles de usuario"""
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


# ============ USER SCHEMAS ============

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=200)
    role: UserRole = UserRole.EMPLOYEE


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=200)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserInDB(User):
    hashed_password: str


# ============ TOKEN SCHEMAS ============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


# ============ LOGIN SCHEMA ============

class LoginRequest(BaseModel):
    username: str
    password: str
