from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pydantic import Field

class Settings(BaseSettings):
    openai_api_type: Optional[str] = Field(default=None, validation_alias="OPENAI_API_TYPE")
    openai_api_key: Optional[str] = Field(default=None, validation_alias="OPENAI_API_KEY")
    openai_api_base: Optional[str] = Field(default=None, validation_alias="OPENAI_API_BASE")
    jwt_secret: str = Field(default=None, validation_alias="SUPABASE_JWT_SECRET")
    supabase_url: str = Field(default=None, validation_alias="SUPABASE_URL")
    supabase_service_key: str = Field(default=None, validation_alias="SUPABASE_SERVICE_KEY")
    # SMTP server settings
    smtp_host: str = Field(default=None, validation_alias="SMTP_HOST")
    smtp_port: str = Field(default=None, validation_alias="SMTP_PORT")
    smtp_user: str = Field(default=None, validation_alias="SMTP_USER")
    smtp_password: str = Field(default=None, validation_alias="SMTP_PASSWORD")
    smtp_from: str = Field(default=None, validation_alias="SMTP_FROM")
    smtp_sender_name: str = Field(default=None, validation_alias="SMTP_SENDER_NAME")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding="utf-8",
    )

# Instantiate the settings
app_settings = Settings()

