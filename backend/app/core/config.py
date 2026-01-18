from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/evolution_lab"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"]

    # Simulation
    default_population_size: int = 20
    default_simulation_duration: float = 8.0
    max_workers: int = 8

    # Frame storage strategy
    frames_keep_top: int = 10
    frames_keep_random: int = 10
    frames_keep_bottom: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
