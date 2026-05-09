from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.auth import USERS, create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class Token(BaseModel):
    access_token: str
    token_type: str


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    hashed = USERS.get(form.username)
    if not hashed or not verify_password(form.password, hashed):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=form.username)
    return Token(access_token=token, token_type="bearer")


@router.get("/me")
def me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}
