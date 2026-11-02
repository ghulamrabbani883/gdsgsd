from datetime import date

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Elexon Wind Intelligence"
    app_env: str = "development"
    api_prefix: str = "/api"

    database_url: str

    elexon_api_base_url: str = (
        "https://data.elexon.co.uk/bmrs/api/v1"
    )

    delivery_start: date = date(2026, 1, 1)
    delivery_end: date = date(2026, 2, 1)

    decision_cutoff_hour: int = 12

    cors_origins: str = (
        "http://localhost:5173,http://localhost:3000"
    )

    http_timeout_seconds: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @property
    def cors_origin_list(self):
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()