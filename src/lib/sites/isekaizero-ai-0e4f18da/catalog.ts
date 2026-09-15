/**
 * Built-in model catalogs. Shapes mirror the target's public catalog endpoints
 * (`/api/llms`, `/api/image-generation/models`) captured on 2026-09-14 and simplified.
 * Prices are USD per million tokens (text) or USD per image (image); the UI shows them as Mana/Arcane (×100).
 * These rows are DISPLAY data for the "platform" catalog; actual requests go to the user's BYOK provider.
 */
import type { LlmModel, ImageModel } from "@/types/isekaizero";

export const PROVIDER_CHIPS = ["all","deepseek","xiaomi","z-ai","moonshotai","qwen","google","x-ai","anthropic","meta","tencent","aion-labs","minimax","baidu"] as const;

export const LLM_CATALOG: LlmModel[] = [
  {
    "id": "deepseek-v4-flash-0731",
    "model": "deepseek-v4-flash-0731",
    "name": "DeepSeek V4 Flash 0731",
    "description": "The 0731 update made it great for roleplaying",
    "modelProvider": "deepseek",
    "iconUrl": "https://logoeps.com/wp-content/uploads/2025/02/DeepSeek_logo_icon.png",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-d",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 91.81,
        "avgTtftMs": 2445,
        "avgLatencyMs": 17519,
        "totalCalls": 6954
      },
      {
        "apiProvider": "dedicated-b",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 17.17,
        "avgTtftMs": 6480,
        "avgLatencyMs": 21096,
        "totalCalls": 27
      },
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 95.22,
        "avgTtftMs": 2200,
        "avgLatencyMs": 13294,
        "totalCalls": 56
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.29,
        "outputPerM": 0.86,
        "cacheReadPerM": 0.091
      }
    ],
    "rating": {
      "average": 2.4,
      "count": 132
    }
  },
  {
    "id": "mimo-v2.5",
    "model": "xiaomi/mimo-v2.5",
    "name": "MiMo-V2.5",
    "description": "Community's favourite model for roleplay based on our poll.",
    "modelProvider": "xiaomi",
    "iconUrl": "https://s3.alterworld.ai/uploads/llmIcon/697534758241055d485ca256/5dbe04fa-ad80-4817-9928-4ab7591f1326.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated",
        "health": "healthy",
        "successPercent": 99.74,
        "cachePercent": 95.2,
        "avgTtftMs": 5795,
        "avgLatencyMs": 44053,
        "totalCalls": 779
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 91.29,
        "avgTtftMs": 4700,
        "avgLatencyMs": 28941,
        "totalCalls": 601
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.18,
        "outputPerM": 0.36,
        "contextTo": 1000000,
        "cacheReadPerM": 0.0364
      }
    ],
    "rating": {
      "average": 3.1,
      "count": 98
    }
  },
  {
    "id": "glm-5.3-flash",
    "model": "glm-5.3-flash",
    "name": "GLM 5.3 Flash",
    "description": "Served by the official Z.AI endpoint.",
    "modelProvider": "z-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68e18156c0f4eb5d4f666288%2F1c9a24a3-56e1-4384-98e5-907e7c91c468.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 36.97,
        "avgTtftMs": 12971,
        "avgLatencyMs": 37018,
        "totalCalls": 505
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 49.68,
        "avgTtftMs": 13305,
        "avgLatencyMs": 44462,
        "totalCalls": 232
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.2,
        "outputPerM": 0.68,
        "cacheReadPerM": 0.039
      }
    ],
    "rating": {
      "average": 3.2,
      "count": 74
    }
  },
  {
    "id": "deepseek-v4.1-flash",
    "model": "deepseek-v4.1-flash",
    "name": "DeepSeek V4.1 Flash",
    "description": "2x price during peak hours (01:00-04:00 and 06:00-10:00 UTC) per official DeepSeek pricing.",
    "modelProvider": "deepseek",
    "iconUrl": "https://logoeps.com/wp-content/uploads/2025/02/DeepSeek_logo_icon.png",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": true,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 90.46,
        "avgTtftMs": 1405,
        "avgLatencyMs": 11596,
        "totalCalls": 212
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.2,
        "outputPerM": 0.81,
        "cacheReadPerM": 0.0039
      }
    ],
    "rating": {
      "average": 2.9,
      "count": 14
    }
  },
  {
    "id": "deepseek-v3.2",
    "model": "deepseek-v3.2",
    "name": "DeepSeek V3.2",
    "description": "It's a great starter model, older tech but it checks out.",
    "modelProvider": "deepseek",
    "iconUrl": "https://logoeps.com/wp-content/uploads/2025/02/DeepSeek_logo_icon.png",
    "contextLimit": 128000,
    "functionCall": false,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-b",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 89.9,
        "avgTtftMs": 3798,
        "avgLatencyMs": 11332,
        "totalCalls": 81
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.36,
        "outputPerM": 0.55,
        "cacheReadPerM": 0.0364
      }
    ],
    "rating": {
      "average": 3.6,
      "count": 17
    }
  },
  {
    "id": "deepseek-v4-pro-0813",
    "model": "deepseek-v4-pro-0813",
    "name": "DeepSeek V4 Pro 0813",
    "description": "2x price during peak hours (01:00-04:00 and 06:00-10:00 UTC) per official DeepSeek pricing.",
    "modelProvider": "deepseek",
    "iconUrl": "https://logoeps.com/wp-content/uploads/2025/02/DeepSeek_logo_icon.png",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 97.03,
        "avgTtftMs": 1858,
        "avgLatencyMs": 12680,
        "totalCalls": 2583
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.89,
        "outputPerM": 2.67,
        "cacheReadPerM": 0.0286
      }
    ],
    "rating": {
      "average": 1.3,
      "count": 44
    }
  },
  {
    "id": "mimo-v2.5-pro",
    "model": "xiaomi/mimo-v2.5-pro",
    "name": "MiMo-V2.5-Pro",
    "description": "Community favourite, now on a dedicated instance with full 1M context and working prefix caching.",
    "modelProvider": "xiaomi",
    "iconUrl": "https://s3.alterworld.ai/uploads/llmIcon/697534758241055d485ca256/5dbe04fa-ad80-4817-9928-4ab7591f1326.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated",
        "health": "healthy",
        "successPercent": 99.85,
        "cachePercent": 91.93,
        "avgTtftMs": 5812,
        "avgLatencyMs": 37972,
        "totalCalls": 671
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 92.61,
        "avgTtftMs": 7952,
        "avgLatencyMs": 23994,
        "totalCalls": 1183
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.57,
        "outputPerM": 1.13,
        "contextTo": 1000000,
        "cacheReadPerM": 0.0468
      }
    ],
    "rating": {
      "average": 3.4,
      "count": 83
    }
  },
  {
    "id": "deepseek-v4-flash",
    "model": "deepseek/deepseek-v4-flash",
    "name": "DeepSeek V4 Flash",
    "description": "From the latest community review it's not great at following instruction.",
    "modelProvider": "deepseek",
    "iconUrl": "https://logoeps.com/wp-content/uploads/2025/02/DeepSeek_logo_icon.png",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 93.88,
        "avgTtftMs": 1874,
        "avgLatencyMs": 8757,
        "totalCalls": 574
      },
      {
        "apiProvider": "byteplus",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 97.71,
        "avgTtftMs": 4148,
        "avgLatencyMs": 11318,
        "totalCalls": 26
      },
      {
        "apiProvider": "inworld",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 97.16,
        "avgTtftMs": 4116,
        "avgLatencyMs": 9290,
        "totalCalls": 12
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.18,
        "outputPerM": 0.36,
        "cacheReadPerM": 0.0364
      }
    ],
    "rating": {
      "average": 3.7,
      "count": 19
    }
  },
  {
    "id": "glm-5.3",
    "model": "glm-5.3",
    "name": "GLM 5.3",
    "description": "Latest GLM model!",
    "modelProvider": "z-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68e18156c0f4eb5d4f666288%2F1c9a24a3-56e1-4384-98e5-907e7c91c468.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-b",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 87.53,
        "avgTtftMs": 6408,
        "avgLatencyMs": 26039,
        "totalCalls": 126
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 95.37,
        "avgTtftMs": 4066,
        "avgLatencyMs": 58310,
        "totalCalls": 54
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.82,
        "outputPerM": 5.72,
        "cacheReadPerM": 0.338
      }
    ],
    "rating": {
      "average": 3.9,
      "count": 12
    }
  },
  {
    "id": "glm-5.2",
    "model": "glm-5.2",
    "name": "GLM 5.2",
    "description": "Latest GLM model!",
    "modelProvider": "z-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68e18156c0f4eb5d4f666288%2F1c9a24a3-56e1-4384-98e5-907e7c91c468.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-b",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 89.87,
        "avgTtftMs": 3020,
        "avgLatencyMs": 20383,
        "totalCalls": 209
      },
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 98.35,
        "avgTtftMs": 4764,
        "avgLatencyMs": 18315,
        "totalCalls": 45
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 98.18,
        "avgTtftMs": 7153,
        "avgLatencyMs": 19770,
        "totalCalls": 23
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.82,
        "outputPerM": 5.72,
        "cacheReadPerM": 0.338
      }
    ],
    "rating": {
      "average": 3.8,
      "count": 19
    }
  },
  {
    "id": "glm-5.1",
    "model": "z-ai/glm-5.1",
    "name": "GLM 5.1",
    "description": "New GLM model! Seems very popular in RP community",
    "modelProvider": "z-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68e18156c0f4eb5d4f666288%2F1c9a24a3-56e1-4384-98e5-907e7c91c468.webp",
    "contextLimit": 200000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 96.16,
        "avgTtftMs": 3672,
        "avgLatencyMs": 14013,
        "totalCalls": 135
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 98.56,
        "avgTtftMs": 8550,
        "avgLatencyMs": 19025,
        "totalCalls": 12
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.07,
        "outputPerM": 4.29,
        "contextTo": 32000,
        "cacheReadPerM": 0.2145
      },
      {
        "contextFrom": 32001,
        "inputPerM": 1.43,
        "outputPerM": 5.01,
        "contextTo": 200000,
        "cacheReadPerM": 0.286
      }
    ],
    "rating": {
      "average": 4.4,
      "count": 8
    }
  },
  {
    "id": "glm-5",
    "model": "z-ai/glm-5",
    "name": "GLM 5",
    "description": "Very popular in RP community",
    "modelProvider": "z-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68e18156c0f4eb5d4f666288%2F1c9a24a3-56e1-4384-98e5-907e7c91c468.webp",
    "contextLimit": 200000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 96.36,
        "avgTtftMs": 2575,
        "avgLatencyMs": 11703,
        "totalCalls": 78
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 92.5,
        "avgTtftMs": 7767,
        "avgLatencyMs": 19535,
        "totalCalls": 125
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.74,
        "outputPerM": 3.35,
        "contextTo": 32000,
        "cacheReadPerM": 0.1495
      },
      {
        "contextFrom": 32001,
        "inputPerM": 1.12,
        "outputPerM": 4.1,
        "contextTo": 200000,
        "cacheReadPerM": 0.2236
      }
    ],
    "rating": {
      "average": 4.3,
      "count": 26
    }
  },
  {
    "id": "glm-4.7",
    "model": "glm-4.7",
    "name": "GLM 4.7",
    "description": "Popular RP model, it seems to be doing good and consistent.",
    "modelProvider": "z-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68e18156c0f4eb5d4f666288%2F1c9a24a3-56e1-4384-98e5-907e7c91c468.webp",
    "contextLimit": 198000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 98.83,
        "avgTtftMs": 2924,
        "avgLatencyMs": 34315,
        "totalCalls": 2
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 33.55,
        "avgTtftMs": 20334,
        "avgLatencyMs": 47393,
        "totalCalls": 4
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.56,
        "outputPerM": 2.61,
        "contextTo": 32000,
        "cacheReadPerM": 0.1118
      },
      {
        "contextFrom": 32001,
        "inputPerM": 0.75,
        "outputPerM": 2.98,
        "contextTo": 198000,
        "cacheReadPerM": 0.1495
      }
    ],
    "rating": {
      "average": 2.6,
      "count": 7
    }
  },
  {
    "id": "kimi-k3",
    "model": "moonshotai/kimi-k3",
    "name": "Kimi K3",
    "description": "Benchmark says it outperform fable 5 in certain part. ",
    "modelProvider": "moonshotai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68e18079c0f4eb5d4f666287%2F9e0aef21-2ff0-4b87-add1-deb2823a8617.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 93.78,
        "avgTtftMs": 5273,
        "avgLatencyMs": 30960,
        "totalCalls": 94
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 77.82,
        "avgTtftMs": 8461,
        "avgLatencyMs": 38937,
        "totalCalls": 14
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 3.9,
        "outputPerM": 19.5,
        "cacheReadPerM": 0.39
      }
    ],
    "rating": {
      "average": 4.8,
      "count": 13
    }
  },
  {
    "id": "qwen3.8-max",
    "model": "qwen/qwen3.8-max",
    "name": "Qwen 3.8 Max",
    "description": "Alibaba's 2.4T flagship model. Worth a try!",
    "modelProvider": "qwen",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 57.29,
        "avgTtftMs": 8158,
        "avgLatencyMs": 34238,
        "totalCalls": 3
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 2.15,
        "outputPerM": 6.44,
        "cacheReadPerM": 0.2678
      }
    ],
    "rating": {
      "average": 3.5,
      "count": 2
    }
  },
  {
    "id": "gemini-3.8-flash",
    "model": "google/gemini-3.8-flash",
    "name": "Gemini 3.8 Flash",
    "description": "Google's most intelligent Flash model yet, 50% off until Dec 31!",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": true,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 47.25,
        "avgTtftMs": 4671,
        "avgLatencyMs": 14099,
        "totalCalls": 146
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 95.95,
        "cachePercent": 92.81,
        "avgTtftMs": 7284,
        "avgLatencyMs": 19461,
        "totalCalls": 74
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.95,
        "outputPerM": 9.75,
        "cacheReadPerM": 0.195
      }
    ],
    "rating": {
      "average": 4,
      "count": 19
    }
  },
  {
    "id": "gemini-3.7-flash",
    "model": "google/gemini-3.7-flash",
    "name": "Gemini 3.7 Flash",
    "description": "The newest Gemini Flash model at 50% off until Dec 31!",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 53.62,
        "avgTtftMs": 6725,
        "avgLatencyMs": 15991,
        "totalCalls": 37
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 85.12,
        "avgTtftMs": 4560,
        "avgLatencyMs": 14204,
        "totalCalls": 27
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.95,
        "outputPerM": 9.75,
        "cacheReadPerM": 0.195
      }
    ],
    "rating": {
      "average": 2.7,
      "count": 45
    }
  },
  {
    "id": "gemini-3.6-flash",
    "model": "google/gemini-3.6-flash",
    "name": "Gemini 3.6 Flash",
    "description": "Latest Gemini Model.",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 73.62,
        "avgTtftMs": 2575,
        "avgLatencyMs": 6121,
        "totalCalls": 21
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 90.93,
        "avgTtftMs": 3909,
        "avgLatencyMs": 14521,
        "totalCalls": 2
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.98,
        "outputPerM": 4.88,
        "cacheReadPerM": 0.0975
      }
    ],
    "rating": {
      "average": 3.7,
      "count": 3
    }
  },
  {
    "id": "gemini-3.5-flash",
    "model": "google/gemini-3.5-flash",
    "name": "Gemini 3.5 Flash",
    "description": "Gemini Flash Model",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.95,
        "outputPerM": 11.7,
        "cacheReadPerM": 0.195
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    }
  },
  {
    "id": "gemini-3.5-flash-lite",
    "model": "google/gemini-3.5-flash-lite",
    "name": "Gemini 3.5 Flash Lite",
    "description": "The latest lite google model.",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 74.17,
        "avgTtftMs": 1638,
        "avgLatencyMs": 5156,
        "totalCalls": 19
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.39,
        "outputPerM": 3.25,
        "cacheReadPerM": 0.039
      }
    ],
    "rating": {
      "average": 3.5,
      "count": 2
    }
  },
  {
    "id": "gemini-3.1-pro-preview",
    "model": "gemini-3.1-pro-preview",
    "name": "Gemini 3.1 Pro Preview",
    "description": "Highly unstable! use at your own risk",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 0,
        "avgTtftMs": 4996,
        "avgLatencyMs": 24658,
        "totalCalls": 5
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 83.14,
        "avgTtftMs": 3551,
        "avgLatencyMs": 12401,
        "totalCalls": 5
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 2.6,
        "outputPerM": 15.6,
        "contextTo": 200000,
        "cacheReadPerM": 0.26
      },
      {
        "contextFrom": 200001,
        "inputPerM": 5.2,
        "outputPerM": 23.4,
        "contextTo": 1048576,
        "cacheReadPerM": 0.52
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    }
  },
  {
    "id": "gemini-3.1-flash-lite",
    "model": "google/gemini-3.1-flash-lite",
    "name": "Gemini 3.1 Flash Lite",
    "description": "The latest cheapest google model is finally here!",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 12.43,
        "avgTtftMs": 2149,
        "avgLatencyMs": 6834,
        "totalCalls": 304
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.33,
        "outputPerM": 1.95,
        "cacheReadPerM": 0.0325
      }
    ],
    "rating": {
      "average": 3.5,
      "count": 2
    }
  },
  {
    "id": "gemini-3-flash-preview",
    "model": "google/gemini-3-flash-preview",
    "name": "Gemini 3 Flash Preview",
    "description": "Personally my favourite model right now best bucks for high quality rp! Especially with reasoning turned on.",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 69.42,
        "avgTtftMs": 2787,
        "avgLatencyMs": 10897,
        "totalCalls": 47
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 96.42,
        "avgTtftMs": 4290,
        "avgLatencyMs": 11885,
        "totalCalls": 4
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.65,
        "outputPerM": 3.9,
        "cacheReadPerM": 0.065
      }
    ],
    "rating": {
      "average": 4.5,
      "count": 2
    }
  },
  {
    "id": "gemini-2.5-pro",
    "model": "gemini-2.5-pro",
    "name": "Google Gemini 2.5 Pro",
    "description": "Powerful story telling model, recommended",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 52.03,
        "avgTtftMs": 3097,
        "avgLatencyMs": 12647,
        "totalCalls": 32
      },
      {
        "apiProvider": "openrouter",
        "health": "degraded",
        "successPercent": 85.71,
        "cachePercent": 73.04,
        "avgTtftMs": 2786,
        "avgLatencyMs": 17031,
        "totalCalls": 7
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.63,
        "outputPerM": 13,
        "contextTo": 200000,
        "cacheReadPerM": 0.1625
      },
      {
        "contextFrom": 200001,
        "inputPerM": 3.25,
        "outputPerM": 19.5,
        "contextTo": 1048576,
        "cacheReadPerM": 0.325
      }
    ],
    "rating": {
      "average": 3,
      "count": 1
    }
  },
  {
    "id": "gemini-2.5-flash",
    "model": "google/gemini-2.5-flash",
    "name": "Google Gemini 2.5 Flash",
    "description": "Powerful model with great story telling, less unhinged feels more tamed and static. It's better if you like more control of your own story.",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 47.7,
        "avgTtftMs": 1392,
        "avgLatencyMs": 4854,
        "totalCalls": 16
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.39,
        "outputPerM": 3.25,
        "cacheReadPerM": 0.039
      }
    ],
    "rating": {
      "average": 3.3,
      "count": 3
    }
  },
  {
    "id": "gemini-2.5-flash-lite",
    "model": "gemini-2.5-flash-lite",
    "name": "Google Gemini 2.5 Flash Lite",
    "description": "Cheap model with low conherency and intelligent.",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 98.48,
        "avgTtftMs": 10691,
        "avgLatencyMs": 16331,
        "totalCalls": 359
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.13,
        "outputPerM": 0.52,
        "cacheReadPerM": 0.013
      }
    ],
    "rating": {
      "average": 1,
      "count": 1
    }
  },
  {
    "id": "gemma-4-31b",
    "model": "gemma-4-31b-it",
    "name": "Gemma 4 31B",
    "description": "The community said Gemma 4 31B is a good RP model.",
    "modelProvider": "google",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "contextLimit": 262144,
    "functionCall": false,
    "reasoning": true,
    "promptCaching": false,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 0,
        "avgTtftMs": 4690,
        "avgLatencyMs": 13423,
        "totalCalls": 1
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.18,
        "outputPerM": 0.52
      }
    ],
    "rating": {
      "average": 4,
      "count": 4
    }
  },
  {
    "id": "grok-4.6",
    "model": "x-ai/grok-4.6",
    "name": "Grok 4.6",
    "description": "xAI's newest flagship model",
    "modelProvider": "x-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F30ec7cdf-2d00-4d43-96bf-d7f91e93a2e3.webp",
    "contextLimit": 500000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 2.6,
        "outputPerM": 7.8,
        "contextTo": 200000,
        "cacheReadPerM": 0.65
      },
      {
        "contextFrom": 200001,
        "inputPerM": 5.2,
        "outputPerM": 15.6,
        "contextTo": 500000,
        "cacheReadPerM": 1.3
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    }
  },
  {
    "id": "grok-4.5",
    "model": "grok-4.5",
    "name": "Grok 4.5",
    "description": "It's unstable, generate gibberish sometimes",
    "modelProvider": "x-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F30ec7cdf-2d00-4d43-96bf-d7f91e93a2e3.webp",
    "contextLimit": 500000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 2.6,
        "outputPerM": 7.8,
        "cacheReadPerM": 0.65
      }
    ],
    "rating": {
      "average": 4,
      "count": 1
    }
  },
  {
    "id": "grok-4.3",
    "model": "grok-4.3",
    "name": "Grok 4.3",
    "description": "Worth a try, price look good",
    "modelProvider": "x-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F30ec7cdf-2d00-4d43-96bf-d7f91e93a2e3.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 89.6,
        "avgTtftMs": 1137,
        "avgLatencyMs": 4615,
        "totalCalls": 19
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.63,
        "outputPerM": 3.25,
        "cacheReadPerM": 0.26
      }
    ],
    "rating": {
      "average": 3.3,
      "count": 3
    }
  },
  {
    "id": "grok-4.20",
    "model": "x-ai/grok-4.2-reasoning",
    "name": "Grok 4.20",
    "description": "Base price dropped by half",
    "modelProvider": "x-ai",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F30ec7cdf-2d00-4d43-96bf-d7f91e93a2e3.webp",
    "contextLimit": 2000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 46.65,
        "avgTtftMs": 700,
        "avgLatencyMs": 22824,
        "totalCalls": 6
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 88.09,
        "avgTtftMs": 1086,
        "avgLatencyMs": 6858,
        "totalCalls": 19
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.63,
        "outputPerM": 3.25,
        "cacheReadPerM": 0.26
      }
    ],
    "rating": {
      "average": 4,
      "count": 2
    }
  },
  {
    "id": "claude-fable-5.1",
    "model": "anthropic/claude-fable-5.1",
    "name": "Claude Fable 5.1",
    "description": "Best model in whole AI industry right now",
    "modelProvider": "anthropic",
    "iconUrl": "https://ih1.redbubble.net/image.5603398849.2012/st,small,507x507-pad,600x600,f8f8f8.jpg",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": true,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 85.96,
        "avgTtftMs": 3927,
        "avgLatencyMs": 33225,
        "totalCalls": 14
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 13,
        "outputPerM": 65,
        "cacheReadPerM": 0.325
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    }
  },
  {
    "id": "claude-fable-5",
    "model": "anthropic/claude-fable-5",
    "name": "Claude Fable 5",
    "description": "Best model in whole AI industry right now",
    "modelProvider": "anthropic",
    "iconUrl": "https://ih1.redbubble.net/image.5603398849.2012/st,small,507x507-pad,600x600,f8f8f8.jpg",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 65.38,
        "avgTtftMs": 16468,
        "avgLatencyMs": 32795,
        "totalCalls": 4
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 13,
        "outputPerM": 65,
        "cacheReadPerM": 1.3
      }
    ],
    "rating": {
      "average": 5,
      "count": 1
    }
  },
  {
    "id": "claude-opus-5",
    "model": "anthropic/claude-opus-5",
    "name": "Claude Opus 5",
    "description": "Latest Claude Opus.",
    "modelProvider": "anthropic",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a14a5d861229a204a509722/6a383090e8cf5e8d3681b365.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "degraded",
        "successPercent": 75,
        "cachePercent": 0,
        "avgTtftMs": 2721,
        "avgLatencyMs": 23012,
        "totalCalls": 4
      },
      {
        "apiProvider": "openrouter",
        "health": "degraded",
        "successPercent": 80,
        "cachePercent": 59.38,
        "avgTtftMs": 2752,
        "avgLatencyMs": 20936,
        "totalCalls": 5
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 6.5,
        "outputPerM": 32.5,
        "cacheReadPerM": 0.65
      }
    ],
    "rating": {
      "average": 5,
      "count": 1
    }
  },
  {
    "id": "claude-sonnet-5",
    "model": "anthropic/claude-sonnet-5",
    "name": "Claude Sonnet 5",
    "description": "New iteration of the smartest model",
    "modelProvider": "anthropic",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a14a5d861229a204a509722/6a383090e8cf5e8d3681b365.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 49.65,
        "avgTtftMs": 2996,
        "avgLatencyMs": 13109,
        "totalCalls": 22
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 2.6,
        "outputPerM": 13,
        "contextTo": 1000000,
        "cacheReadPerM": 0.26
      }
    ],
    "rating": {
      "average": 4,
      "count": 2
    }
  },
  {
    "id": "claude-opus-4.8",
    "model": "anthropic/claude-opus-4.8",
    "name": "Claude Opus 4.8",
    "description": "Latest Claude Opus.",
    "modelProvider": "anthropic",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a14a5d861229a204a509722/6a383090e8cf5e8d3681b365.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 6.5,
        "outputPerM": 32.5,
        "cacheReadPerM": 0.65
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    }
  },
  {
    "id": "claude-opus-4.7",
    "model": "anthropic/claude-opus-4.7",
    "name": "Claude Opus 4.7",
    "description": "Latest Claude Opus.",
    "modelProvider": "anthropic",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a14a5d861229a204a509722/6a383090e8cf5e8d3681b365.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 6.5,
        "outputPerM": 32.5,
        "cacheReadPerM": 0.65
      }
    ],
    "rating": {
      "average": 4,
      "count": 1
    }
  },
  {
    "id": "claude-opus-4.6",
    "model": "anthropic/claude-opus-4.6",
    "name": "Claude Opus 4.6",
    "description": "The forbidden fruit. The best of the best but it will ruin you.",
    "modelProvider": "anthropic",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a14a5d861229a204a509722/6a383090e8cf5e8d3681b365.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 87.62,
        "avgTtftMs": 3007,
        "avgLatencyMs": 17229,
        "totalCalls": 38
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 0,
        "avgTtftMs": 6156,
        "avgLatencyMs": 47506,
        "totalCalls": 2
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 6.5,
        "outputPerM": 32.5,
        "cacheReadPerM": 0.65
      }
    ],
    "rating": {
      "average": 5,
      "count": 2
    }
  },
  {
    "id": "claude-sonnet-4.6",
    "model": "anthropic/claude-sonnet-4.6",
    "name": "Claude Sonnet 4.6",
    "description": "New iteration of the smartest model",
    "modelProvider": "anthropic",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a14a5d861229a204a509722/6a383090e8cf5e8d3681b365.webp",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 95.09,
        "avgTtftMs": 2414,
        "avgLatencyMs": 13769,
        "totalCalls": 4
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 3.9,
        "outputPerM": 19.5,
        "contextTo": 200000,
        "cacheReadPerM": 0.39
      },
      {
        "contextFrom": 200001,
        "inputPerM": 7.8,
        "outputPerM": 29.25,
        "contextTo": 1000000,
        "cacheReadPerM": 0.78
      }
    ],
    "rating": {
      "average": 5,
      "count": 1
    }
  },
  {
    "id": "claude-haiku-4.5",
    "model": "anthropic/claude-haiku-4.5",
    "name": "Claude Haiku 4.5",
    "description": "If you like claude's style this is the lite version. Not as inteligent but it's logical.",
    "modelProvider": "anthropic",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f52d341286d73b96c3daf7%2F95662cbe-4503-49b3-bc66-f9f051685ae1.webp",
    "contextLimit": 200000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 90.6,
        "avgTtftMs": 1436,
        "avgLatencyMs": 6394,
        "totalCalls": 2
      },
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.3,
        "outputPerM": 6.5,
        "cacheReadPerM": 0.13
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    }
  },
  {
    "id": "claude-sonnet-4.5",
    "model": "claude-sonnet-4.5",
    "name": "Claude Sonnet 4.5",
    "description": "It's probably the smartest model right now but it's often more logical. Greatest in terms of coherency.",
    "modelProvider": "anthropic",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a14a5d861229a204a509722/6a383090e8cf5e8d3681b365.webp",
    "contextLimit": 1000000,
    "functionCall": false,
    "reasoning": false,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 68.92,
        "avgTtftMs": 1606,
        "avgLatencyMs": 9600,
        "totalCalls": 4
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 3.9,
        "outputPerM": 19.5,
        "contextTo": 200000,
        "cacheReadPerM": 0.39
      },
      {
        "contextFrom": 200001,
        "inputPerM": 7.8,
        "outputPerM": 29.25,
        "contextTo": 1000000,
        "cacheReadPerM": 0.78
      }
    ],
    "rating": {
      "average": 5,
      "count": 1
    }
  },
  {
    "id": "muse-spark-1.2-contributor",
    "model": "muse-spark-1.2-contributor",
    "name": "Muse Spark 1.2 Contributor",
    "description": "Temporary extreme cheap pricing so ZUCC can have your data, seems like a very capable model. Might go away anytime!",
    "modelProvider": "meta",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads/llmIcon/manual/74ddae4e-decc-4c55-870a-5b358ce0a57a.jpg",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 49.46,
        "avgTtftMs": 4959,
        "avgLatencyMs": 11833,
        "totalCalls": 7
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.15,
        "outputPerM": 0.3,
        "contextTo": 1048576,
        "cacheReadPerM": 0.0026
      }
    ],
    "rating": {
      "average": 3.7,
      "count": 3
    }
  },
  {
    "id": "muse-spark-1.3-contributor",
    "model": "muse-spark-1.3-contributor",
    "name": "Muse Spark 1.3 Contributor",
    "description": "Temporary extreme cheap pricing so ZUCC can have your data, seems like a very capable model. Might go away anytime!",
    "modelProvider": "meta",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads/llmIcon/manual/74ddae4e-decc-4c55-870a-5b358ce0a57a.jpg",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": true,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 97.44,
        "cachePercent": 23.93,
        "avgTtftMs": 5695,
        "avgLatencyMs": 12734,
        "totalCalls": 39
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.15,
        "outputPerM": 0.3,
        "contextTo": 1048576,
        "cacheReadPerM": 0.0026
      }
    ],
    "rating": {
      "average": 3,
      "count": 1
    }
  },
  {
    "id": "hy3",
    "model": "hy3",
    "name": "Tencent Hy3",
    "description": "Tencent's cheap model huh? Feedback needed",
    "modelProvider": "tencent",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F80cdac71-28fa-458c-9955-ceeeb732d0a1.webp",
    "contextLimit": 262144,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.18,
        "outputPerM": 0.75,
        "cacheReadPerM": 0.0455
      }
    ],
    "rating": {
      "average": 3.3,
      "count": 4
    }
  },
  {
    "id": "hy4-preview",
    "model": "hy4-preview",
    "name": "Tencent Hy4 Preview",
    "description": "",
    "modelProvider": "tencent",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F80cdac71-28fa-458c-9955-ceeeb732d0a1.webp",
    "contextLimit": 1048576,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": true,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 99.35,
        "avgTtftMs": 4404,
        "avgLatencyMs": 59754,
        "totalCalls": 3
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 1.08,
        "outputPerM": 3.25,
        "contextTo": 1048576,
        "cacheReadPerM": 0.0546
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    }
  },
  {
    "id": "aion-3.0-mini",
    "model": "aion-labs/aion-3.0-mini",
    "name": "Aion 3.0 Mini",
    "description": "Claimed to be a model that's trained for storytelling",
    "modelProvider": "aion-labs",
    "iconUrl": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.aionlabs.ai/&size=256",
    "contextLimit": 131000,
    "functionCall": false,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 86.72,
        "avgTtftMs": 1188,
        "avgLatencyMs": 14756,
        "totalCalls": 1
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.91,
        "outputPerM": 1.82,
        "cacheReadPerM": 0.234
      }
    ],
    "rating": {
      "average": 3.5,
      "count": 6
    }
  },
  {
    "id": "aion-3.0",
    "model": "aion-labs/aion-3.0",
    "name": "Aion 3.0",
    "description": "Claimed to be a model that's trained for storytelling",
    "modelProvider": "aion-labs",
    "iconUrl": "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.aionlabs.ai/&size=256",
    "contextLimit": 131000,
    "functionCall": false,
    "reasoning": true,
    "promptCaching": true,
    "premium": true,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 3.9,
        "outputPerM": 7.8,
        "cacheReadPerM": 0.975
      }
    ],
    "rating": {
      "average": 3,
      "count": 2
    }
  },
  {
    "id": "minimax-m3",
    "model": "minimax/minimax-m3",
    "name": "MiniMax M3",
    "description": "Quite good model with strong reasoning",
    "modelProvider": "minimax",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads/llmIcon/192945411.jpeg",
    "contextLimit": 1000000,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "infron",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 99.14,
        "avgTtftMs": 8421,
        "avgLatencyMs": 26818,
        "totalCalls": 30
      },
      {
        "apiProvider": "minimax",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 90.11,
        "avgTtftMs": 1547,
        "avgLatencyMs": 8078,
        "totalCalls": 20
      },
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 80.09,
        "avgTtftMs": 1908,
        "avgLatencyMs": 4122,
        "totalCalls": 7
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.39,
        "outputPerM": 1.56,
        "contextTo": 512000,
        "cacheReadPerM": 0.078
      },
      {
        "contextFrom": 512001,
        "inputPerM": 0.78,
        "outputPerM": 3.12,
        "contextTo": 1000000,
        "cacheReadPerM": 0.156
      }
    ],
    "rating": {
      "average": 2.9,
      "count": 16
    }
  },
  {
    "id": "minimax-m2.7",
    "model": "minimax-m2.7",
    "name": "MiniMax M2.7",
    "description": "Probably the best alternative with really good reasoning!",
    "modelProvider": "minimax",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads/llmIcon/192945411.jpeg",
    "contextLimit": 204800,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "openrouter",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 87.82,
        "avgTtftMs": 2002,
        "avgLatencyMs": 19831,
        "totalCalls": 30
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.39,
        "outputPerM": 1.56,
        "cacheReadPerM": 0.078
      }
    ],
    "rating": {
      "average": 3.3,
      "count": 4
    }
  },
  {
    "id": "qwen3.5-9b",
    "model": "qwen3.5-9b",
    "name": "Qwen 3.5 9B",
    "description": "Very capable small and cheap model. Worth a try!",
    "modelProvider": "qwen",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "contextLimit": 65536,
    "functionCall": false,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-z",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.13,
        "outputPerM": 0.2,
        "cacheReadPerM": 0.065
      }
    ],
    "rating": {
      "average": 3,
      "count": 4
    }
  },
  {
    "id": "qwen3.6-35b-abliterated",
    "model": "qwen3.6-35b-a3b-abliterated-awq",
    "name": "Qwen 3.6 35B",
    "description": "Qwen 3.6 35B a3b-abliterated, uncensored mid-size model. Worth a try!",
    "modelProvider": "qwen",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "contextLimit": 65536,
    "functionCall": true,
    "reasoning": true,
    "promptCaching": true,
    "premium": false,
    "free": false,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-z",
        "health": "no_data",
        "successPercent": 100,
        "avgTtftMs": 0,
        "avgLatencyMs": 0,
        "totalCalls": 0
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.2,
        "outputPerM": 1.3,
        "cacheReadPerM": 0.065
      }
    ],
    "rating": {
      "average": 3,
      "count": 1
    }
  },
  {
    "id": "qwen3.5-9b-free",
    "model": "qwen3.5-9b",
    "name": "Qwen 3.5 9B (Unlimited)",
    "description": "Uncensored. It's not great but it's unlimited usage no daily limits for now.",
    "modelProvider": "qwen",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "contextLimit": 65536,
    "functionCall": false,
    "reasoning": false,
    "promptCaching": true,
    "premium": false,
    "free": true,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-z",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 76.25,
        "avgTtftMs": 4530,
        "avgLatencyMs": 9168,
        "totalCalls": 132
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.13,
        "outputPerM": 0.2,
        "cacheReadPerM": 0.065
      }
    ],
    "rating": {
      "average": 1.7,
      "count": 6
    }
  },
  {
    "id": "qwen3.6-35b-abliterated-free",
    "model": "qwen3.6-35b-a3b-abliterated-awq",
    "name": "Qwen 3.6 35B",
    "description": "Qwen 3.6 35B a3b-abliterated, uncensored. Free for now, might go away later. Feedback welcome at discord!",
    "modelProvider": "qwen",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "contextLimit": 65536,
    "functionCall": false,
    "reasoning": false,
    "promptCaching": true,
    "premium": false,
    "free": true,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-z",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 10.21,
        "avgTtftMs": 10515,
        "avgLatencyMs": 28946,
        "totalCalls": 118
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.2,
        "outputPerM": 1.3,
        "cacheReadPerM": 0.065
      }
    ],
    "rating": {
      "average": 2,
      "count": 3
    }
  },
  {
    "id": "mimo-v2.5-free",
    "model": "xiaomi/mimo-v2.5",
    "name": "MiMo-V2.5",
    "description": "Community's favourite model for roleplay based on our poll. We are testing it as a free model for now, it might go away later.",
    "modelProvider": "xiaomi",
    "iconUrl": "https://s3.alterworld.ai/uploads/llmIcon/697534758241055d485ca256/5dbe04fa-ad80-4817-9928-4ab7591f1326.webp",
    "contextLimit": 30000,
    "functionCall": false,
    "reasoning": false,
    "promptCaching": true,
    "premium": false,
    "free": true,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 70.05,
        "avgTtftMs": 5285,
        "avgLatencyMs": 16905,
        "totalCalls": 533
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.18,
        "outputPerM": 0.36,
        "contextTo": 1000000,
        "cacheReadPerM": 0.065
      }
    ],
    "rating": {
      "average": 4.5,
      "count": 8
    }
  },
  {
    "id": "deepseek-v4-flash-0731-free",
    "model": "deepseek-v4-flash-0731",
    "name": "DeepSeek V4 Flash 0731",
    "description": "The long awaited Deepseek v4 is here!",
    "modelProvider": "deepseek",
    "iconUrl": "https://logoeps.com/wp-content/uploads/2025/02/DeepSeek_logo_icon.png",
    "contextLimit": 30000,
    "functionCall": false,
    "reasoning": false,
    "promptCaching": true,
    "premium": false,
    "free": true,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "dedicated-d",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 71.16,
        "avgTtftMs": 2179,
        "avgLatencyMs": 7334,
        "totalCalls": 339
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.19,
        "outputPerM": 0.38,
        "cacheReadPerM": 0.0036
      }
    ],
    "rating": {
      "average": 2.9,
      "count": 20
    }
  },
  {
    "id": "ernie-5.1-preview-free",
    "model": "ernie-5.1-preview",
    "name": "ERNIE 5.1 Preview",
    "description": "Free, but might go away anytime. Leave your feedback at discord!",
    "modelProvider": "baidu",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxbI6XBIBJ-5fJxBXeBrA4uD-cZAqDinLp5H2d9ZjQu4pru7mpDRNH2RG3&s=10",
    "contextLimit": 40000,
    "functionCall": false,
    "reasoning": false,
    "promptCaching": false,
    "premium": false,
    "free": true,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "baidu",
        "health": "degraded",
        "successPercent": 88.52,
        "cachePercent": 0,
        "avgTtftMs": 5634,
        "avgLatencyMs": 11701,
        "totalCalls": 61
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0.36,
        "outputPerM": 1.61
      }
    ],
    "rating": {
      "average": 3,
      "count": 3
    }
  },
  {
    "id": "ernie-4.5-turbo",
    "model": "ernie-4.5-turbo-128k",
    "name": "ERNIE 4.5 Turbo",
    "description": "Baidu turbo model? free for now but may go anytime.",
    "modelProvider": "baidu",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxbI6XBIBJ-5fJxBXeBrA4uD-cZAqDinLp5H2d9ZjQu4pru7mpDRNH2RG3&s=10",
    "contextLimit": 40000,
    "functionCall": false,
    "reasoning": false,
    "promptCaching": false,
    "premium": false,
    "free": true,
    "isNew": false,
    "routes": [
      {
        "apiProvider": "baidu",
        "health": "healthy",
        "successPercent": 100,
        "cachePercent": 7.92,
        "avgTtftMs": 4301,
        "avgLatencyMs": 10889,
        "totalCalls": 6
      }
    ],
    "prices": [
      {
        "contextFrom": 0,
        "inputPerM": 0,
        "outputPerM": 0
      }
    ],
    "rating": {
      "average": 0,
      "count": 0
    }
  }
];

export const IMAGE_CATALOG: ImageModel[] = [
  {
    "id": "69add2331f6e3564f660a582",
    "model": "grok-imagine-image",
    "name": "Grok Imagine Image",
    "description": "In the cheap tier, this is the best model! Up to 3 reference images. 1K resolution.",
    "modelProvider": "x-ai",
    "apiProvider": "grok",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F30ec7cdf-2d00-4d43-96bf-d7f91e93a2e3.webp",
    "costPerImage": 0.03,
    "actions": [
      "edit",
      "generate"
    ],
    "illustrationReady": true,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 3,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "6a7da2dbbd69d1a962f5c162",
    "model": "qwen/qwen-image-3.0",
    "name": "Qwen Image 3.0",
    "description": "Uncensored. Alibaba's newest image model, strong prompt adherence and text rendering. Up to 3 reference images. 1K resolution, up to 2K.",
    "modelProvider": "qwen",
    "apiProvider": "infron",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "costPerImage": 0.04,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 3,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1152,
        "height": 768,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 768,
        "height": 1152,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1792,
        "height": 768,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 768,
        "height": 1792,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      },
      {
        "key": "portrait-2k",
        "label": "Portrait 2K",
        "width": 1152,
        "height": 2048,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "square-2k",
        "label": "Square 2K",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "landscape-2k",
        "label": "Landscape 2K",
        "width": 2048,
        "height": 1152,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      }
    ]
  },
  {
    "id": "69e9172382dc91982e426bb7",
    "model": "wan/wan2.7",
    "name": "Wan 2.7 Image",
    "description": "Fast and best performing for it's price but generation quality is not consistenly good. Up to 9 reference images. 2K resolution.",
    "modelProvider": "alibaba",
    "apiProvider": "infron",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "costPerImage": 0.04,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 9,
    "presets": [
      {
        "key": "portrait",
        "label": "Portrait 2K",
        "width": 1536,
        "height": 2048,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "square",
        "label": "Square 2K",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "landscape",
        "label": "Landscape 2K",
        "width": 2048,
        "height": 1536,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "wide",
        "label": "Wide 2K",
        "width": 2048,
        "height": 1152,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "tall",
        "label": "Tall 2K",
        "width": 1152,
        "height": 2048,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "6a7dc788bd69d1a962f5c163",
    "model": "grok-imagine-image-2.0",
    "name": "Grok Imagine Image 2.0",
    "description": "xAI's newest image model. Up to 5 reference images. 1K resolution.",
    "modelProvider": "x-ai",
    "apiProvider": "grok",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F30ec7cdf-2d00-4d43-96bf-d7f91e93a2e3.webp",
    "costPerImage": 0.05,
    "actions": [
      "edit",
      "generate"
    ],
    "illustrationReady": true,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 5,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "6a7f8bc578328158349c9398",
    "model": "qwen/qwen-image-3.0/pro",
    "name": "Qwen Image 3.0 Pro",
    "description": "Uncensored. Pro version of Qwen Image 3.0 with higher quality output. 1K resolution. Up to 3 reference images.",
    "modelProvider": "qwen",
    "apiProvider": "infron",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "costPerImage": 0.05,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 3,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1152,
        "height": 768,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 768,
        "height": 1152,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1792,
        "height": 768,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 768,
        "height": 1792,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "6a4f7aaf5dcfd71d35dab529",
    "model": "google/nano-banana-2-lite",
    "name": "Nano Banana 2 Lite",
    "description": "Google Nano Banana 2 Lite (Gemini 3.1 Flash Lite Image): Pro-quality generation and editing at Flash speed, character consistency for up to 5 characters. Up to 14 reference images. 1K resolution.",
    "modelProvider": "google",
    "apiProvider": "infron",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "costPerImage": 0.05,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": true,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 14,
    "presets": [
      {
        "key": "square",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "portrait",
        "label": "Portrait",
        "width": 864,
        "height": 1184,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "landscape",
        "label": "Landscape",
        "width": 1184,
        "height": 864,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "wide",
        "label": "Wide",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "tall",
        "label": "Tall",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "portrait-2-3",
        "label": "Portrait 2:3",
        "width": 832,
        "height": 1248,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "landscape-3-2",
        "label": "Landscape 3:2",
        "width": 1248,
        "height": 832,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "portrait-4-5",
        "label": "Portrait 4:5",
        "width": 896,
        "height": 1152,
        "aspectRatio": "4:5",
        "orientation": "portrait"
      },
      {
        "key": "landscape-5-4",
        "label": "Landscape 5:4",
        "width": 1152,
        "height": 896,
        "aspectRatio": "5:4",
        "orientation": "landscape"
      },
      {
        "key": "ultrawide",
        "label": "Ultrawide 21:9",
        "width": 1536,
        "height": 672,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      }
    ]
  },
  {
    "id": "694af8e0150955303e2512ae",
    "model": "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
    "name": "851 Labs",
    "description": "Remove backgrounds from images.",
    "modelProvider": "851-labs",
    "apiProvider": "replicate",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/851-labs.png",
    "costPerImage": 0.001,
    "actions": [
      "remove-background"
    ],
    "illustrationReady": false,
    "visualNovelReady": false,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 0,
    "presets": []
  },
  {
    "id": "695c662e4a7c6b13859dadb5",
    "model": "qwen-image/edit-2511",
    "name": "Qwen Image Edit 2511",
    "description": "Qwen Image Edit 2511 is a major upgrade over 2509 for real-world image editing and design. It delivers stronger edit consistency, robust multi-person identity/pose consistency, built-in LoRA styles, enhanced industrial/product design, and improved geometric reasoning for structure-preserving edits. Up to 3 reference images. 1K resolution.",
    "modelProvider": "qwen",
    "apiProvider": "wavespeed",
    "iconUrl": "https://s3.alterworld.ai/uploads/imageModelIcon/695c662e4a7c6b13859dadb5/df813b0b-fb2f-48a0-b923-2100a520e855.webp",
    "costPerImage": 0.02,
    "actions": [
      "edit"
    ],
    "illustrationReady": false,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 3,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69b08fa994dd9ec538c45c0b",
    "model": "rmbg",
    "name": "Toonout",
    "description": "Fast fine tuned characters background removal",
    "modelProvider": "briaai",
    "apiProvider": "comfyui",
    "iconUrl": "https://docs.isekai.world/uploads/images/system/2025-11/icon.png",
    "costPerImage": 0.001,
    "actions": [
      "remove-background"
    ],
    "illustrationReady": false,
    "visualNovelReady": false,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 0,
    "presets": []
  },
  {
    "id": "6a50079fc28ed5bfe5576f54",
    "model": "ep-20260710042232-zp9xh",
    "name": "Seedream 5 Pro",
    "description": "Uncensored, cheap and very capable but very very slow. Up to 10 reference images. 2K resolution.",
    "modelProvider": "bytedance",
    "apiProvider": "byteplus",
    "iconUrl": "https://s3.alterworld.ai/uploads/llmIcon/697d0a3705a6046cf07f068e/8a6dc579-6097-497b-a0cc-3c7b353d84a4.webp",
    "costPerImage": 0.06,
    "actions": [
      "edit",
      "generate"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 10,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 1728,
        "height": 2304,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 1600,
        "height": 2848,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 2304,
        "height": 1728,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 2496,
        "height": 1664,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 1664,
        "height": 2496,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 3136,
        "height": 1344,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 2848,
        "height": 1600,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 1344,
        "height": 3136,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69c0f7b6b0146040d0d23f17",
    "model": "seedream-4-5-251128",
    "name": "Seedream 4.5",
    "description": "Lightly censored, good value for money model, balance between speed and performance. Up to 10 reference images. 2K resolution.",
    "modelProvider": "bytedance",
    "apiProvider": "byteplus",
    "iconUrl": "https://s3.alterworld.ai/uploads/llmIcon/697d0a3705a6046cf07f068e/8a6dc579-6097-497b-a0cc-3c7b353d84a4.webp",
    "costPerImage": 0.05,
    "actions": [
      "edit",
      "generate"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 10,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 1728,
        "height": 2304,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 1600,
        "height": 2848,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 2304,
        "height": 1728,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 2496,
        "height": 1664,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 1664,
        "height": 2496,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 3136,
        "height": 1344,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 2848,
        "height": 1600,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 1344,
        "height": 3136,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69c1e884fc45f6e3495f3475",
    "model": "seedream-5-0-260128",
    "name": "Seedream 5 Lite",
    "description": "Lightly censored, good value for money model, balance between speed and performance but pretty slow. Up to 10 reference images. 2K resolution.",
    "modelProvider": "bytedance",
    "apiProvider": "byteplus",
    "iconUrl": "https://s3.alterworld.ai/uploads/llmIcon/697d0a3705a6046cf07f068e/8a6dc579-6097-497b-a0cc-3c7b353d84a4.webp",
    "costPerImage": 0.05,
    "actions": [
      "edit",
      "generate"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 10,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 1728,
        "height": 2304,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 1600,
        "height": 2848,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 2304,
        "height": 1728,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 2496,
        "height": 1664,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 1664,
        "height": 2496,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 3136,
        "height": 1344,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 2848,
        "height": 1600,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 1344,
        "height": 3136,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69c346f9fc45f6e3495f3488",
    "model": "google/nano-banana-2",
    "name": "Nano Banana 2 Edit (1k)",
    "description": "[1k Resolution] This is probably the 2nd best model right now it's very censored but the performance is comparable to the pro version and its half the price. Up to 14 reference images.",
    "modelProvider": "google",
    "apiProvider": "infron",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "costPerImage": 0.09,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 14,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69bc90a6b0146040d0d23f04",
    "model": "google/nano-banana-2",
    "name": "Nano Banana 2 Edit (2k)",
    "description": "This is probably the 2nd best model right now it's very censored but the performance is comparable to the pro version and its half the price. Up to 14 reference images. 2K resolution.",
    "modelProvider": "google",
    "apiProvider": "infron",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "costPerImage": 0.14,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 14,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 1792,
        "height": 2304,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 1536,
        "height": 2688,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 2304,
        "height": 1792,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 2048,
        "height": 1280,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 1280,
        "height": 2048,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 3072,
        "height": 1280,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 2688,
        "height": 1536,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 1280,
        "height": 3072,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69668e5e7ea93a33ddf4c0fc",
    "model": "google/nano-banana-pro",
    "name": "Nano Banana Pro Edit",
    "description": "Google's best image editing model. Up to 14 reference images. 2K resolution.",
    "modelProvider": "google",
    "apiProvider": "infron",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "costPerImage": 0.2,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 14,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 1792,
        "height": 2304,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 1536,
        "height": 2688,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 2304,
        "height": 1792,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 2048,
        "height": 1280,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 1280,
        "height": 2048,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 3072,
        "height": 1280,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 2688,
        "height": 1536,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 1280,
        "height": 3072,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "6a50b8a04c97997dc4c25a81",
    "model": "openai/gpt-image-2",
    "name": "GPT Image 2",
    "description": "OpenAI GPT Image 2, strong at following complex instructions and text in images. Medium quality. Up to 5 reference images. 1K resolution, up to 2K.",
    "modelProvider": "openai",
    "apiProvider": "infron",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a040bebf29ee7ccf026d226/6a049bdef36382f67c45aa1c.webp",
    "costPerImage": 0.07,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 5,
    "presets": [
      {
        "key": "square",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "portrait",
        "label": "Portrait",
        "width": 1024,
        "height": 1536,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "landscape",
        "label": "Landscape",
        "width": 1536,
        "height": 1024,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "wide",
        "label": "Wide",
        "width": 2048,
        "height": 1152,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "square-2k",
        "label": "Square 2K",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      }
    ]
  },
  {
    "id": "6aa2bea6e5260be26ca72727",
    "model": "openai/gpt-image-2.5-flare",
    "name": "GPT Image 2.5 Flare",
    "description": "OpenAI GPT Image 2.5 Flare, the fast default model with natural lighting, rich textures and strong text rendering. Medium quality. Up to 5 reference images. 1K resolution, up to 2K.",
    "modelProvider": "openai",
    "apiProvider": "infron",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a040bebf29ee7ccf026d226/6a049bdef36382f67c45aa1c.webp",
    "costPerImage": 0.02,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 5,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1152,
        "height": 768,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 768,
        "height": 1152,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1792,
        "height": 768,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 768,
        "height": 1792,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      },
      {
        "key": "portrait-2k",
        "label": "Portrait 2K",
        "width": 1152,
        "height": 2048,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "square-2k",
        "label": "Square 2K",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "landscape-2k",
        "label": "Landscape 2K",
        "width": 2048,
        "height": 1152,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      }
    ]
  },
  {
    "id": "6aa2bea6e5260be26ca72728",
    "model": "openai/gpt-image-2.5-sunburst",
    "name": "GPT Image 2.5 Sunburst",
    "description": "OpenAI GPT Image 2.5 Sunburst, the precision model with extra fidelity on intricate detail and the tightest edit control, slower than Flare. Medium quality. Up to 5 reference images. 1K resolution, up to 2K.",
    "modelProvider": "openai",
    "apiProvider": "infron",
    "iconUrl": "https://s3.alterworld.ai/uploads/galleries/6a040bebf29ee7ccf026d226/6a049bdef36382f67c45aa1c.webp",
    "costPerImage": 0.02,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 5,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1152,
        "height": 768,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 768,
        "height": 1152,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1792,
        "height": 768,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 768,
        "height": 1792,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      },
      {
        "key": "portrait-2k",
        "label": "Portrait 2K",
        "width": 1152,
        "height": 2048,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "square-2k",
        "label": "Square 2K",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "landscape-2k",
        "label": "Landscape 2K",
        "width": 2048,
        "height": 1152,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      }
    ]
  },
  {
    "id": "6971438b1b95ace4a694870c",
    "model": "qwen-image-2512",
    "name": "Qwen Image 2512",
    "description": "An image generation foundation model in the Qwen series that achieves significant advances in complex text rendering. 1K resolution.",
    "modelProvider": "qwen",
    "apiProvider": "runware",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "costPerImage": 0.01,
    "actions": [
      "generate"
    ],
    "illustrationReady": false,
    "visualNovelReady": false,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 0,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69c6c8a8fc45f6e3495f34a3",
    "model": "qwen-image-2.0",
    "name": "Qwen Image 2.0",
    "description": "Least censored, latest qwen model. Up to 3 reference images. 1K resolution.",
    "modelProvider": "qwen",
    "apiProvider": "qwen",
    "iconUrl": "https://s3.alterworld.ai/uploads/imageModelIcon/695c662e4a7c6b13859dadb5/df813b0b-fb2f-48a0-b923-2100a520e855.webp",
    "costPerImage": 0.03,
    "actions": [
      "edit",
      "generate"
    ],
    "illustrationReady": false,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 3,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "695c69fd4a7c6b13859dadb8",
    "model": "z-image/turbo",
    "name": "Z Image Turbo",
    "description": "Z Image Turbo is a 6 billion parameter text-to-image model that generates photorealistic images in sub-second time. 1K resolution.",
    "modelProvider": "z-image",
    "apiProvider": "runware",
    "iconUrl": "https://s3.alterworld.ai/uploads/imageModelIcon/695c69fd4a7c6b13859dadb8/3c618023-d37c-4c4c-aa0d-fc43798daca3.webp",
    "costPerImage": 0.005,
    "actions": [
      "generate"
    ],
    "illustrationReady": false,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 0,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "68ebafe9998c6a6a26818fa9",
    "model": "qwen-image",
    "name": "Qwen Image",
    "description": "An image generation foundation model in the Qwen series that achieves significant advances in complex text rendering. 1K resolution.",
    "modelProvider": "qwen",
    "apiProvider": "runware",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "costPerImage": 0.01,
    "actions": [
      "generate"
    ],
    "illustrationReady": false,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 0,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "68f93d9a9567d848da477270",
    "model": "qwen-image-edit-plus",
    "name": "Qwen Image Edit Plus",
    "description": "The latest Qwen-Image's iteration with improved multi-image editing, single-image consistency, and native support for ControlNet. Up to 3 reference images. 1K resolution.",
    "modelProvider": "qwen",
    "apiProvider": "wavespeed",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "costPerImage": 0.02,
    "actions": [
      "edit"
    ],
    "illustrationReady": false,
    "visualNovelReady": false,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 3,
    "presets": [
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69e9172382dc91982e426bb0",
    "model": "wan/wan2.7/pro",
    "name": "Wan 2.7 Image Pro",
    "description": "Fast and capable model, uncensored. Up to 9 reference images. 2K resolution.",
    "modelProvider": "alibaba",
    "apiProvider": "infron",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/default/qwen.jpg",
    "costPerImage": 0.09,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": true,
    "maxReferenceImages": 9,
    "presets": [
      {
        "key": "portrait",
        "label": "Portrait",
        "width": 1536,
        "height": 2048,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "square",
        "label": "Square",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "landscape",
        "label": "Landscape",
        "width": 2048,
        "height": 1536,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "wide",
        "label": "Wide",
        "width": 2048,
        "height": 1152,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "tall",
        "label": "Tall",
        "width": 1152,
        "height": 2048,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "695c69324a7c6b13859dadb7",
    "model": "qwen-image/text-to-image-2512",
    "name": "Qwen Image 2512",
    "description": "Qwen Image 2512 is Alibaba Qwen's latest text-to-image model with enhanced prompt understanding, superior text rendering, and versatile aspect ratio support. 1K resolution.",
    "modelProvider": "qwen",
    "apiProvider": "wavespeed",
    "iconUrl": "https://s3.alterworld.ai/uploads/imageModelIcon/695c69324a7c6b13859dadb7/7f2a71ac-812d-415d-a00e-89e74e52ae40.webp",
    "costPerImage": 0.02,
    "actions": [
      "generate"
    ],
    "illustrationReady": false,
    "visualNovelReady": true,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 0,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69af09761f6e3564f660a599",
    "model": "grok-imagine-image-pro",
    "name": "Grok Imagine Image Pro",
    "description": "Best grok image gen! Up to 3 reference images. 1K resolution.",
    "modelProvider": "x-ai",
    "apiProvider": "grok",
    "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F30ec7cdf-2d00-4d43-96bf-d7f91e93a2e3.webp",
    "costPerImage": 0.09,
    "actions": [
      "edit",
      "generate"
    ],
    "illustrationReady": false,
    "visualNovelReady": false,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 3,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "695c6f43e009bab73b682c72",
    "model": "kwaivgi/kling-image-o1",
    "name": "Kling Omni Image O1",
    "description": "Kling Omni Image O1 is Kuaishou's multi-modal image generation model with MVL technology. Supports up to 10 reference images for feature consistency, precise detail editing (add/remove/modify), style control, and series content creation. Perfect for IP character design, comic panels, and brand merchandise. 1K resolution.",
    "modelProvider": "kwaivgi",
    "apiProvider": "wavespeed",
    "iconUrl": "https://s3.alterworld.ai/uploads/imageModelIcon/695c6f43e009bab73b682c72/115c57f1-c43f-4869-b8b7-d957af99a50c.webp",
    "costPerImage": 0.028,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": false,
    "visualNovelReady": false,
    "mangaReady": false,
    "premium": false,
    "maxReferenceImages": 10,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "6aa2cf89edc2db2b9f0b5600",
    "model": "meta/muse-image",
    "name": "Muse Image",
    "description": "Meta Muse Image via Wavespeed. Strong multi-character consistency and exact speech-bubble text for manga pages and light novel illustrations. Slow: 40 to 120 seconds per image. Up to 10 reference images. 2K resolution.",
    "modelProvider": "meta",
    "apiProvider": "wavespeed",
    "iconUrl": "https://s3.alterworld.ai/default/meta.png",
    "costPerImage": 0.01,
    "actions": [
      "generate",
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 10,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 1536,
        "height": 2048,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 2048,
        "height": 2048,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 1152,
        "height": 2048,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 2048,
        "height": 1536,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 2048,
        "height": 1365,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 1365,
        "height": 2048,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 2048,
        "height": 878,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 2048,
        "height": 1152,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 878,
        "height": 2048,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  },
  {
    "id": "69cfee23fc45f6e3495f34d9",
    "model": "google/nano-banana-pro/edit",
    "name": "Nano Banana Pro Edit (Backup)",
    "description": "Google's best image editing model. Up to 14 reference images. 2K resolution.",
    "modelProvider": "google",
    "apiProvider": "wavespeed",
    "iconUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s",
    "costPerImage": 0.2,
    "actions": [
      "edit"
    ],
    "illustrationReady": true,
    "visualNovelReady": false,
    "mangaReady": true,
    "premium": false,
    "maxReferenceImages": 14,
    "presets": [
      {
        "key": "3:4",
        "label": "Portrait Standard",
        "width": 896,
        "height": 1152,
        "aspectRatio": "3:4",
        "orientation": "portrait"
      },
      {
        "key": "1:1",
        "label": "Square",
        "width": 1024,
        "height": 1024,
        "aspectRatio": "1:1",
        "orientation": "square"
      },
      {
        "key": "9:16",
        "label": "Portrait",
        "width": 768,
        "height": 1344,
        "aspectRatio": "9:16",
        "orientation": "portrait"
      },
      {
        "key": "4:3",
        "label": "Standard",
        "width": 1152,
        "height": 896,
        "aspectRatio": "4:3",
        "orientation": "landscape"
      },
      {
        "key": "3:2",
        "label": "Photo",
        "width": 1024,
        "height": 640,
        "aspectRatio": "3:2",
        "orientation": "landscape"
      },
      {
        "key": "2:3",
        "label": "Portrait Photo",
        "width": 640,
        "height": 1024,
        "aspectRatio": "2:3",
        "orientation": "portrait"
      },
      {
        "key": "21:9",
        "label": "Ultra Wide",
        "width": 1536,
        "height": 640,
        "aspectRatio": "21:9",
        "orientation": "landscape"
      },
      {
        "key": "16:9",
        "label": "Landscape",
        "width": 1344,
        "height": 768,
        "aspectRatio": "16:9",
        "orientation": "landscape"
      },
      {
        "key": "9:21",
        "label": "Ultra Tall",
        "width": 640,
        "height": 1536,
        "aspectRatio": "9:21",
        "orientation": "portrait"
      }
    ]
  }
];
