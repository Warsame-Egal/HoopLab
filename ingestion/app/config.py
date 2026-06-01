"""Optional nba_api request configuration."""

import logging
import os
import random
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv

    env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(env_path)
except ImportError:
    pass

logger = logging.getLogger(__name__)


class ApiConfig:
    def __init__(self):
        config_env = os.getenv("NBA_API_CONFIG", "")

        if config_env:
            self.config_list = [p.strip() for p in config_env.split(",") if p.strip()]
        else:
            self.config_list = []

    def get_config(self) -> Optional[str]:
        if not self.config_list:
            return None

        if len(self.config_list) == 1:
            return self.config_list[0]

        return random.choice(self.config_list)


api_config = ApiConfig()


def get_request_config() -> Optional[str]:
    return api_config.get_config()
