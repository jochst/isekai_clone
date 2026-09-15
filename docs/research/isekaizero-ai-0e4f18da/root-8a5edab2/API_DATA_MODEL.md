# Isekai Zero API data model (public endpoints observed)

Base URLs: https://api-global.isekaizero.ai and https://api-us.isekaizero.ai (Firebase auth; guest = anonymous Firebase user). Envelope: `{code:200,status:'success',data:...}`.

## Endpoints observed

- GET /api/llms — text model catalog (public)
- GET /api/image-generation/models?actions=generate|edit|remove-background — image model catalog (public)
- GET /api/ai-tools — function-call tools
- GET /api/auth/profile — current user (balances: freeBalance/paidBalance as $numberDecimal, isAnonymous, defaultChatSettings)
- GET /api/storylines/weekly-featured?nsfw=false
- GET /api/storylines/promoted-hero?limit=10&nsfw=false&seed=..&page=0
- GET /api/search?type=storyline&page=1&pageSize=12&nsfw=false&sortType=random|trending|publishedAt|calendarMostMessage|calendarMostLike&period=today&category=sciFi|horror|academy&featured=true&visualNovelReady=true&dmV2=true
- GET /api/storylines/:id?excludeOwner=true
- GET /api/userComments/table?_storylineId=..&page=0&pageSize=10&sort=best
- GET /api/search/related/storyline?_id=..&pageSize=12
- Expo routes: /chats/[_chatId]/llms, /default-chat-settings/llms, /storylines/llm-picker, /llm-reviews/[modelGroup], /creation/generate-image

## LLM object shape (from /api/llms)

```json
{
 "reasoningOptions": {
  "toggleable": true,
  "effortAdjustable": false,
  "maxTokenAdjustable": false,
  "requireReasoningEcho": true
 },
 "unlimited": false,
 "dmReady": false,
 "mediaPickerReady": false,
 "mediaPickerDefault": false,
 "dmDefault": false,
 "arcReady": false,
 "arcDefault": false,
 "_id": "6a78eb66f8a20fb4c99ed415",
 "name": "DeepSeek V4 Flash 0731",
 "description": "The 0731 update made it great for roleplaying",
 "iconUrl": "https://logoeps.com/wp-content/uploads/2025/02/DeepSeek_logo_icon.png",
 "apiProvider": "dedicated-d",
 "model": "deepseek-v4-flash-0731",
 "modelProvider": "deepseek",
 "modelGroup": "deepseek-v4-flash-0731",
 "functionCall": true,
 "supportJsonScheme": false,
 "reasoningModel": true,
 "defaultSettings": {
  "reasoning": true,
  "playMode": "visual-novel",
  "autoPlay": false,
  "visualNovelVoice": false,
  "autoCreateCharacter": false,
  "autoEditBackground": false,
  "autoCreateBackground": false,
  "autoEditCharacter": false,
  "autoEditCharacterCount": 1,
  "disableLocalStreaming": false,
  "responseLength": "medium",
  "temperature": "medium",
  "summaryDetail": "balanced",
  "disableMediaPicker": false,
  "disableStoryMusic": false,
  "promptVersion": 2,
  "continueBehavior": "control",
  "perspective": "2nd",
  "responseTokenLimit": "capped",
  "speakingRate": 1,
  "ttsMode": "narration",
  "charactersSpeakingRate": 1,
  "mangaMaxPages": 2,
  "mangaAutoCreateCharacter": true,
  "mangaAutoEditCharacter": true,
  "lightNovelAutoCreateCharacter": false,
  "lightNovelAutoEditCharacter": false,
  "videoAutoCreateCharacter": true,
  "videoAutoEditCharacter": true,
  "videoSceneAutoGenerateBeats": true,
  "enabledTools": [],
  "autoGenModes": []
 },
 "contextLimit": 1000000,
 "prices": [
  {
   "_id": "6aa8897e1e021aba25b7f31f",
   "contextFrom": 0,
   "inputCostPerMToken": 0.22,
   "outputCostPerMToken": 0.66,
   "cacheReadCostPerMToken": 0.07,
   "inputCostWithMarkup": 0.29,
   "outputCostWithMarkup": 0.86,
   "id": "6aa8897e1e021aba25b7f31f"
  }
 ],
 "markupPercent": 30,
 "markupDiscountPercent": 0,
 "visibility": "public",
 "default": true,
 "defaultForFunctions": true,
 "preferred": false,
 "premium": false,
 "free": false,
 "new": false,
 "order": -3435,
 "deleted": false,
 "createdAt": "2026-08-10T05:20:00.000Z",
 "updatedAt": "2026-09-14T11:35:00.000Z",
 "chapterDefault": true,
 "chapterReady": true,
 "summarizationDescription": "Very cheap, fast, strong quality",
 "id": "6a78eb66f8a20fb4c99ed415",
 "health": {
  "status": "healthy",
  "successPercent": 100,
  "cachePercent": 91.81,
  "avgLatencyMs": 17519,
  "rpm": 695,
  "tps": 44,
  "avgTtftMs": 2445,
  "totalCalls": 6954
 },
 "reviewStats": {
  "averageRating": 2.4,
  "totalRatings": 132,
  "totalComments": 114,
  "distribution": {
   "1": 55,
   "2": 23,
   "3": 18,
   "4": 12,
   "5": 24
  }
 }
}
```

## LLM catalog summary (name | modelGroup | model | apiProvider | modelProvider | ctx | premium | free | in/out $ per M with markup | health | rating)

- DeepSeek V4 Flash 0731 | deepseek-v4-flash-0731 | deepseek-v4-flash-0731 | dedicated-d | deepseek | 1000000 | premium=False free=False new=False | 0.29/0.86 | healthy 100% ttft=2445ms lat=17519ms calls=6954 | 2.4 (132) | fn=True reasoning=True cache=True | desc: The 0731 update made it great for roleplaying
- DeepSeek V4 Flash 0731 | deepseek-v4-flash-0731 | deepseek-v4-flash-0731 | dedicated-b | deepseek | 1000000 | premium=False free=False new=False | 0.29/0.86 | healthy 100% ttft=6480ms lat=21096ms calls=27 | 2.4 (132) | fn=True reasoning=True cache=True | desc: The 0731 update made it great for roleplaying
- MiMo-V2.5 | mimo-v2.5 | xiaomi/mimo-v2.5 | dedicated | xiaomi | 1000000 | premium=False free=False new=False | 0.18/0.36 | healthy 99.74% ttft=5795ms lat=44053ms calls=779 | 3.1 (98) | fn=True reasoning=True cache=True | desc: Community's favourite model for roleplay based on our poll.
- MiMo-V2.5 | mimo-v2.5 | mimo-v2.5 | openrouter | xiaomi | 1000000 | premium=False free=False new=None | 0.18/0.36 | healthy 100% ttft=4700ms lat=28941ms calls=601 | 3.1 (98) | fn=True reasoning=True cache=True | desc: Community's favourite model for roleplay based on our poll.
- GLM 5.3 Flash | glm-5.3-flash | glm-5.3-flash | openrouter | z-ai | 1000000 | premium=False free=False new=False | 0.2/0.68 | healthy 100% ttft=12971ms lat=37018ms calls=505 | 3.2 (74) | fn=True reasoning=True cache=True | desc: Served by the official Z.AI endpoint.
- GLM 5.3 Flash | glm-5.3-flash | glm-5.3-flash | openrouter | z-ai | 1000000 | premium=False free=False new=False | 0.2/0.68 | healthy 100% ttft=13305ms lat=44462ms calls=232 | 3.2 (74) | fn=True reasoning=True cache=True | desc: High-speed providers, routed to the fastest available.
- DeepSeek V4 Flash 0731 | deepseek-v4-flash-0731 | deepseek/deepseek-v4-flash-0731 | infron | deepseek | 1000000 | premium=False free=False new=None | 0.29/0.86 | healthy 100% ttft=2200ms lat=13294ms calls=56 | 2.4 (132) | fn=True reasoning=True cache=True | desc: Great and cheap model.
- DeepSeek V4.1 Flash | deepseek-v4.1-flash | deepseek-v4.1-flash | openrouter | deepseek | 1000000 | premium=False free=False new=True | 0.2/0.81 | healthy 100% ttft=1405ms lat=11596ms calls=212 | 2.9 (14) | fn=True reasoning=True cache=True | desc: 2x price during peak hours (01:00-04:00 and 06:00-10:00 UTC) per official DeepSeek pricing.
- DeepSeek V3.2 | deepseek-v3.2 | deepseek-v3.2 | dedicated-b | deepseek | 128000 | premium=False free=False new=None | 0.36/0.55 | healthy 100% ttft=3798ms lat=11332ms calls=81 | 3.6 (17) | fn=False reasoning=True cache=True | desc: It's a great starter model, older tech but it checks out.
- DeepSeek V4 Pro 0813 | deepseek-v4-pro-0813 | deepseek-v4-pro-0813 | openrouter | deepseek | 1000000 | premium=False free=False new=False | 0.89/2.67 | healthy 100% ttft=1858ms lat=12680ms calls=2583 | 1.3 (44) | fn=True reasoning=True cache=True | desc: 2x price during peak hours (01:00-04:00 and 06:00-10:00 UTC) per official DeepSeek pricing.
- MiMo-V2.5-Pro | mimo-v2.5-pro | xiaomi/mimo-v2.5-pro | dedicated | xiaomi | 1000000 | premium=False free=False new=False | 0.57/1.13 | healthy 99.85% ttft=5812ms lat=37972ms calls=671 | 3.4 (83) | fn=True reasoning=True cache=True | desc: Community favourite, now on a dedicated instance with full 1M context and working prefix caching.
- MiMo-V2.5-Pro | mimo-v2.5-pro | mimo-v2.5-pro | openrouter | xiaomi | 1000000 | premium=False free=False new=None | 0.57/1.13 | healthy 100% ttft=7952ms lat=23994ms calls=1183 | 3.4 (83) | fn=True reasoning=True cache=True | desc: It has issue with cache but the community love this model.
- DeepSeek V4 Flash | deepseek-v4-flash | deepseek/deepseek-v4-flash | infron | deepseek | 1000000 | premium=False free=False new=None | 0.18/0.36 | healthy 100% ttft=1874ms lat=8757ms calls=574 | 3.7 (19) | fn=True reasoning=True cache=True | desc: From the latest community review it's not great at following instruction.
- DeepSeek V4 Flash | deepseek-v4-flash | deepseek-v4-flash-260425 | byteplus | deepseek | 1000000 | premium=False free=False new=None | 0.18/0.36 | healthy 100% ttft=4148ms lat=11318ms calls=26 | 3.7 (19) | fn=True reasoning=True cache=True | desc: From the latest community review it's not great at following instruction.
- DeepSeek V4 Flash | deepseek-v4-flash | inworld/models/deepseek-v4-flash | inworld | deepseek | 1000000 | premium=False free=False new=None | 0.18/0.36 | healthy 100% ttft=4116ms lat=9290ms calls=12 | 3.7 (19) | fn=True reasoning=True cache=True | desc: From the latest community review it's not great at following instruction.
- GLM 5.3 | glm-5.3 | glm-5.3 | dedicated-b | z-ai | 1000000 | premium=False free=False new=False | 1.82/5.72 | healthy 100% ttft=6408ms lat=26039ms calls=126 | 3.9 (12) | fn=True reasoning=True cache=True | desc: Latest GLM model!
- GLM 5.3 | glm-5.3 | glm-5.3 | openrouter | z-ai | 1000000 | premium=False free=False new=False | 1.89/5.94 | healthy 100% ttft=4066ms lat=58310ms calls=54 | 3.9 (12) | fn=True reasoning=True cache=True | desc: Latest GLM model!
- GLM 5.2 | glm-5.2 | glm-5.2 | dedicated-b | z-ai | 1000000 | premium=False free=False new=False | 1.82/5.72 | healthy 100% ttft=3020ms lat=20383ms calls=209 | 3.8 (19) | fn=True reasoning=True cache=True | desc: Latest GLM model!
- GLM 5.2 | glm-5.2 | z-ai/glm-5.2 | infron | z-ai | 1000000 | premium=False free=False new=None | 1.43/5.01 | healthy 100% ttft=4764ms lat=18315ms calls=45 | 3.8 (19) | fn=True reasoning=True cache=True | desc: Latest GLM model!
- GLM 5.2 | glm-5.2 | glm-5.2 | openrouter | z-ai | 1000000 | premium=False free=False new=None | 1.89/5.94 | healthy 100% ttft=7153ms lat=19770ms calls=23 | 3.8 (19) | fn=True reasoning=True cache=True | desc: Latest GLM model!
- GLM 5.1 | glm-5.1 | z-ai/glm-5.1 | infron | z-ai | 200000 | premium=False free=False new=None | 1.07/4.29 | healthy 100% ttft=3672ms lat=14013ms calls=135 | 4.4 (8) | fn=True reasoning=True cache=True | desc: New GLM model! Seems very popular in RP community
- GLM 5.1 | glm-5.1 | glm-5.1 | openrouter | z-ai | 200000 | premium=False free=False new=None | 1.89/5.94 | healthy 100% ttft=8550ms lat=19025ms calls=12 | 4.4 (8) | fn=True reasoning=True cache=True | desc: Latest GLM model!
- GLM 5 | glm-5 | z-ai/glm-5 | infron | z-ai | 200000 | premium=False free=False new=None | 0.74/3.35 | healthy 100% ttft=2575ms lat=11703ms calls=78 | 4.3 (26) | fn=True reasoning=True cache=True | desc: Very popular in RP community
- GLM 5 | glm-5 | glm-5 | openrouter | z-ai | 200000 | premium=False free=False new=None | 1.35/4.32 | healthy 100% ttft=7767ms lat=19535ms calls=125 | 4.3 (26) | fn=True reasoning=True cache=True | desc: Very popular in RP community
- GLM 4.7 | glm-4.7 | glm-4.7 | infron | z-ai | 198000 | premium=False free=False new=None | 0.56/2.61 | healthy 100% ttft=2924ms lat=34315ms calls=2 | 2.6 (7) | fn=True reasoning=True cache=True | desc: Popular RP model, it seems to be doing good and consistent.
- GLM 4.7 | glm-4.7 | glm-4.7 | openrouter | z-ai | 200000 | premium=False free=False new=None | 0.81/2.97 | healthy 100% ttft=20334ms lat=47393ms calls=4 | 2.6 (7) | fn=True reasoning=True cache=True | desc: Popular RP model, it seems to be doing good and consistent.
- Kimi K3 | kimi-k3 | moonshotai/kimi-k3 | infron | moonshotai | 1000000 | premium=True free=False new=False | 3.9/19.5 | healthy 100% ttft=5273ms lat=30960ms calls=94 | 4.8 (13) | fn=True reasoning=True cache=True | desc: Benchmark says it outperform fable 5 in certain part. 
- Kimi K3 | kimi-k3 | moonshotai/kimi-k3 | openrouter | moonshotai | 1000000 | premium=True free=False new=False | 3.9/19.5 | healthy 100% ttft=8461ms lat=38937ms calls=14 | 4.8 (13) | fn=True reasoning=True cache=True | desc: Benchmark says it outperform fable 5 in certain part. Super slow
- Qwen 3.8 Max | qwen3.8-max | qwen/qwen3.8-max | infron | qwen | 1000000 | premium=False free=False new=False | 2.15/6.44 | healthy 100% ttft=8158ms lat=34238ms calls=3 | 3.5 (2) | fn=True reasoning=True cache=True | desc: Alibaba's 2.4T flagship model. Worth a try!
- Gemini 3.8 Flash | gemini-3.8-flash | google/gemini-3.8-flash | infron | google | 1048576 | premium=False free=False new=True | 1.95/9.75 | healthy 100% ttft=4671ms lat=14099ms calls=146 | 4 (19) | fn=True reasoning=True cache=True | desc: Google's most intelligent Flash model yet, 50% off until Dec 31!
- Gemini 3.8 Flash | gemini-3.8-flash | gemini-3.8-flash | openrouter | google | 1048576 | premium=False free=False new=True | 2.03/10.13 | healthy 95.95% ttft=7284ms lat=19461ms calls=74 | 4 (19) | fn=True reasoning=True cache=True | desc: Google's most intelligent Flash model yet, 50% off until Dec 31!
- Gemini 3.7 Flash | gemini-3.7-flash | google/gemini-3.7-flash | infron | google | 1048576 | premium=False free=False new=False | 1.95/9.75 | healthy 100% ttft=6725ms lat=15991ms calls=37 | 2.7 (45) | fn=True reasoning=True cache=True | desc: The newest Gemini Flash model at 50% off until Dec 31!
- Gemini 3.7 Flash | gemini-3.7-flash | gemini-3.7-flash | openrouter | google | 1048576 | premium=False free=False new=False | 2.03/10.13 | healthy 100% ttft=4560ms lat=14204ms calls=27 | 2.7 (45) | fn=True reasoning=True cache=True | desc: The newest Gemini Flash model at 50% off until Dec 31!
- Gemini 3.6 Flash | gemini-3.6-flash | google/gemini-3.6-flash | infron | google | 1048576 | premium=False free=False new=False | 0.98/4.88 | healthy 100% ttft=2575ms lat=6121ms calls=21 | 3.7 (3) | fn=True reasoning=True cache=True | desc: Latest Gemini Model.
- Gemini 3.6 Flash | gemini-3.6-flash | gemini-3.6-flash | openrouter | google | 1048576 | premium=False free=False new=False | 1.01/5.06 | healthy 100% ttft=3909ms lat=14521ms calls=2 | 3.7 (3) | fn=True reasoning=True cache=True | desc: Latest Gemini Model.
- Gemini 3.5 Flash | gemini-3.5-flash | google/gemini-3.5-flash | infron | google | 1048576 | premium=False free=False new=None | 1.95/11.7 | no_data None% ttft=Nonems lat=Nonems calls=0 | None (None) | fn=True reasoning=True cache=True | desc: Gemini Flash Model
- Gemini 3.5 Flash Lite | gemini-3.5-flash-lite | google/gemini-3.5-flash-lite | infron | google | 1048576 | premium=False free=False new=False | 0.39/3.25 | healthy 100% ttft=1638ms lat=5156ms calls=19 | 3.5 (2) | fn=True reasoning=True cache=True | desc: The latest lite google model.
- Gemini 3.1 Pro Preview | gemini-3.1-pro-preview | gemini-3.1-pro-preview | infron | google | 1048576 | premium=True free=False new=None | 2.6/15.6 | healthy 100% ttft=4996ms lat=24658ms calls=5 | None (None) | fn=True reasoning=True cache=True | desc: Highly unstable! use at your own risk
- Gemini 3.1 Pro Preview | gemini-3.1-pro-preview | gemini-3.1-pro-preview | openrouter | google | 1048576 | premium=True free=False new=None | 2.7/16.2 | healthy 100% ttft=3551ms lat=12401ms calls=5 | None (None) | fn=True reasoning=True cache=True | desc: Highly unstable! use at your own risk
- Gemini 3.1 Flash Lite | gemini-3.1-flash-lite | google/gemini-3.1-flash-lite | infron | google | 1048576 | premium=False free=False new=None | 0.33/1.95 | healthy 100% ttft=2149ms lat=6834ms calls=304 | 3.5 (2) | fn=True reasoning=True cache=True | desc: The latest cheapest google model is finally here!
- Gemini 3.1 Flash Lite | gemini-3.1-flash-lite | gemini-3.1-flash-lite | openrouter | google | 1048576 | premium=False free=False new=None | 0.34/2.03 | no_data None% ttft=Nonems lat=Nonems calls=0 | 3.5 (2) | fn=True reasoning=True cache=True | desc: The latest cheapest google model is finally here!
- Gemini 3 Flash Preview | gemini-3-flash-preview | google/gemini-3-flash-preview | infron | google | 1048576 | premium=False free=False new=None | 0.65/3.9 | healthy 100% ttft=2787ms lat=10897ms calls=47 | 4.5 (2) | fn=True reasoning=True cache=True | desc: Personally my favourite model right now best bucks for high quality rp! Especially with reasoning turned on.
- Gemini 3 Flash Preview | gemini-3-flash-preview | gemini-3-flash-preview | openrouter | google | 1048576 | premium=False free=False new=None | 0.68/4.05 | healthy 100% ttft=4290ms lat=11885ms calls=4 | 4.5 (2) | fn=True reasoning=True cache=True | desc: Gemini Flash Model
- Google Gemini 2.5 Pro | gemini-2.5-pro | gemini-2.5-pro | infron | google | 1048576 | premium=True free=False new=None | 1.63/13 | healthy 100% ttft=3097ms lat=12647ms calls=32 | 3 (1) | fn=True reasoning=True cache=True | desc: Powerful story telling model, recommended
- Google Gemini 2.5 Pro | gemini-2.5-pro | gemini-2.5-pro | openrouter | google | 1048576 | premium=True free=False new=None | 1.69/13.5 | degraded 85.71% ttft=2786ms lat=17031ms calls=7 | 3 (1) | fn=True reasoning=True cache=True | desc: Powerful story telling model, recommended
- Google Gemini 2.5 Flash | gemini-2.5-flash | google/gemini-2.5-flash | infron | google | 1048576 | premium=False free=False new=None | 0.39/3.25 | healthy 100% ttft=1392ms lat=4854ms calls=16 | 3.3 (3) | fn=True reasoning=True cache=True | desc: Powerful model with great story telling, less unhinged feels more tamed and static. It's better if you like more control of your own story.
- Google Gemini 2.5 Flash | gemini-2.5-flash | gemini-2.5-flash | openrouter | google | 1048576 | premium=False free=False new=None | 0.41/3.38 | no_data None% ttft=Nonems lat=Nonems calls=0 | 3.3 (3) | fn=True reasoning=True cache=True | desc: Powerful model with great story telling, less unhinged feels more tamed and static. It's better if you like more control of your own story.
- Google Gemini 2.5 Flash Lite | gemini-2.5-flash-lite | gemini-2.5-flash-lite | openrouter | google | 1048576 | premium=False free=False new=None | 0.13/0.52 | healthy 100% ttft=10691ms lat=16331ms calls=359 | 1 (1) | fn=True reasoning=True cache=True | desc: Cheap model with low conherency and intelligent.
- Gemma 4 31B | gemma-4-31b | gemma-4-31b-it | openrouter | google | 262144 | premium=False free=False new=None | 0.18/0.52 | healthy 100% ttft=4690ms lat=13423ms calls=1 | 4 (4) | fn=False reasoning=True cache=False | desc: The community said Gemma 4 31B is a good RP model.
- Grok 4.6 | grok-4.6 | x-ai/grok-4.6 | infron | x-ai | 500000 | premium=True free=False new=False | 2.6/7.8 | no_data None% ttft=Nonems lat=Nonems calls=0 | None (None) | fn=True reasoning=True cache=True | desc: xAI's newest flagship model
- Grok 4.5 | grok-4.5 | grok-4.5 | openrouter | x-ai | 500000 | premium=True free=False new=False | 2.6/7.8 | no_data None% ttft=Nonems lat=Nonems calls=0 | 4 (1) | fn=True reasoning=True cache=True | desc: It's unstable, generate gibberish sometimes
- Grok 4.3 | grok-4.3 | grok-4.3 | openrouter | x-ai | 1000000 | premium=False free=False new=None | 1.63/3.25 | healthy 100% ttft=1137ms lat=4615ms calls=19 | 3.3 (3) | fn=True reasoning=True cache=True | desc: Worth a try, price look good
- Grok 4.20 | grok-4.20 | x-ai/grok-4.2-reasoning | infron | x-ai | 2000000 | premium=False free=False new=None | 1.63/3.25 | healthy 100% ttft=700ms lat=22824ms calls=6 | 4 (2) | fn=True reasoning=True cache=True | desc: Base price dropped by half
- Grok 4.20 | grok-4.20 | grok-4.20 | openrouter | x-ai | 2000000 | premium=False free=False new=None | 1.63/3.25 | healthy 100% ttft=1086ms lat=6858ms calls=19 | 4 (2) | fn=True reasoning=True cache=True | desc: Base price dropped by half
- Claude Fable 5.1 | claude-fable-5.1 | anthropic/claude-fable-5.1 | infron | anthropic | 1000000 | premium=True free=False new=True | 13/65 | healthy 100% ttft=3927ms lat=33225ms calls=14 | None (None) | fn=True reasoning=True cache=True | desc: Best model in whole AI industry right now
- Claude Fable 5.1 | claude-fable-5.1 | anthropic/claude-fable-5.1 | openrouter | anthropic | 1000000 | premium=True free=False new=True | 13/65 | no_data None% ttft=Nonems lat=Nonems calls=0 | None (None) | fn=True reasoning=True cache=True | desc: Best model in whole AI industry right now
- Claude Fable 5 | claude-fable-5 | anthropic/claude-fable-5 | infron | anthropic | 1000000 | premium=True free=False new=False | 13/65 | healthy 100% ttft=16468ms lat=32795ms calls=4 | 5 (1) | fn=True reasoning=True cache=True | desc: Best model in whole AI industry right now
- Claude Opus 5 | claude-opus-5 | anthropic/claude-opus-5 | infron | anthropic | 1000000 | premium=True free=False new=False | 6.5/32.5 | degraded 75% ttft=2721ms lat=23012ms calls=4 | 5 (1) | fn=True reasoning=True cache=True | desc: Latest Claude Opus.
- Claude Fable 5 | claude-fable-5 | anthropic/claude-fable-5 | openrouter | anthropic | 1000000 | premium=True free=False new=False | 13/65 | no_data None% ttft=Nonems lat=Nonems calls=0 | 5 (1) | fn=True reasoning=True cache=True | desc: Best model in whole AI industry right now
- Claude Opus 5 | claude-opus-5 | claude-opus-5 | openrouter | anthropic | 1000000 | premium=True free=False new=False | 6.5/32.5 | degraded 80% ttft=2752ms lat=20936ms calls=5 | 5 (1) | fn=True reasoning=True cache=True | desc: Latest Claude Opus.
- Claude Sonnet 5 | claude-sonnet-5 | anthropic/claude-sonnet-5 | infron | anthropic | 1000000 | premium=True free=False new=None | 2.6/13 | healthy 100% ttft=2996ms lat=13109ms calls=22 | 4 (2) | fn=True reasoning=True cache=True | desc: New iteration of the smartest model
- Claude Sonnet 5 | claude-sonnet-5 | anthropic/claude-sonnet-5 | openrouter | anthropic | 1000000 | premium=True free=False new=None | 2.6/13 | no_data None% ttft=Nonems lat=Nonems calls=0 | 4 (2) | fn=True reasoning=True cache=True | desc: New iteration of the smartest model
- Claude Opus 4.8 | claude-opus-4.8 | anthropic/claude-opus-4.8 | infron | anthropic | 1000000 | premium=True free=False new=None | 6.5/32.5 | no_data None% ttft=Nonems lat=Nonems calls=0 | None (None) | fn=True reasoning=True cache=True | desc: Latest Claude Opus.
- Claude Opus 4.8 | claude-opus-4.8 | claude-opus-4.8 | openrouter | anthropic | 1000000 | premium=True free=False new=None | 6.5/32.5 | no_data None% ttft=Nonems lat=Nonems calls=0 | None (None) | fn=True reasoning=True cache=True | desc: Latest Claude Opus.
- Claude Opus 4.7 | claude-opus-4.7 | anthropic/claude-opus-4.7 | infron | anthropic | 1000000 | premium=True free=False new=None | 6.5/32.5 | no_data None% ttft=Nonems lat=Nonems calls=0 | 4 (1) | fn=True reasoning=True cache=True | desc: Latest Claude Opus.
- Claude Opus 4.7 | claude-opus-4.7 | claude-opus-4.7 | openrouter | anthropic | 1000000 | premium=True free=False new=None | 6.5/32.5 | no_data None% ttft=Nonems lat=Nonems calls=0 | 4 (1) | fn=True reasoning=True cache=True | desc: The forbidden fruit. The best of the best but it will ruin you.
- Claude Opus 4.6 | claude-opus-4.6 | anthropic/claude-opus-4.6 | infron | anthropic | 1000000 | premium=True free=False new=None | 6.5/32.5 | healthy 100% ttft=3007ms lat=17229ms calls=38 | 5 (2) | fn=True reasoning=True cache=True | desc: The forbidden fruit. The best of the best but it will ruin you.
- Claude Opus 4.6 | claude-opus-4.6 | claude-opus-4.6 | openrouter | anthropic | 1000000 | premium=True free=False new=None | 6.5/32.5 | healthy 100% ttft=6156ms lat=47506ms calls=2 | 5 (2) | fn=True reasoning=True cache=True | desc: The forbidden fruit. The best of the best but it will ruin you.
- Claude Sonnet 4.6 | claude-sonnet-4.6 | anthropic/claude-sonnet-4.6 | infron | anthropic | 1000000 | premium=True free=False new=None | 3.9/19.5 | healthy 100% ttft=2414ms lat=13769ms calls=4 | 5 (1) | fn=True reasoning=True cache=True | desc: New iteration of the smartest model
- Claude Sonnet 4.6 | claude-sonnet-4.6 | claude-sonnet-4.6 | openrouter | anthropic | 1000000 | premium=True free=False new=None | 3.9/19.5 | no_data None% ttft=Nonems lat=Nonems calls=0 | 5 (1) | fn=True reasoning=True cache=True | desc: New iteration of the smartest model
- Claude Haiku 4.5 | claude-haiku-4.5 | anthropic/claude-haiku-4.5 | infron | anthropic | 200000 | premium=False free=False new=None | 1.3/6.5 | healthy 100% ttft=1436ms lat=6394ms calls=2 | None (None) | fn=True reasoning=True cache=True | desc: If you like claude's style this is the lite version. Not as inteligent but it's logical.
- Claude Haiku 4.5 | claude-haiku-4.5 | claude-haiku-4.5 | openrouter | anthropic | 200000 | premium=False free=False new=None | 1.3/6.5 | no_data None% ttft=Nonems lat=Nonems calls=0 | None (None) | fn=True reasoning=True cache=True | desc: If you like claude's style this is the lite version. Not as inteligent but it's logical.
- Claude Sonnet 4.5 | claude-sonnet-4.5 | claude-sonnet-4.5 | openrouter | anthropic | 1000000 | premium=True free=False new=None | 3.9/19.5 | healthy 100% ttft=1606ms lat=9600ms calls=4 | 5 (1) | fn=False reasoning=False cache=True | desc: It's probably the smartest model right now but it's often more logical. Greatest in terms of coherency.
- Muse Spark 1.2 Contributor | muse-spark-1.2-contributor | muse-spark-1.2-contributor | openrouter | meta | 1048576 | premium=False free=False new=False | 0.15/0.3 | healthy 100% ttft=4959ms lat=11833ms calls=7 | 3.7 (3) | fn=True reasoning=True cache=True | desc: Temporary extreme cheap pricing so ZUCC can have your data, seems like a very capable model. Might go away anytime!
- Muse Spark 1.3 Contributor | muse-spark-1.3-contributor | muse-spark-1.3-contributor | openrouter | meta | 1048576 | premium=False free=False new=True | 0.15/0.3 | healthy 97.44% ttft=5695ms lat=12734ms calls=39 | 3 (1) | fn=True reasoning=True cache=True | desc: Temporary extreme cheap pricing so ZUCC can have your data, seems like a very capable model. Might go away anytime!
- Tencent Hy3 | hy3 | hy3 | openrouter | tencent | 262144 | premium=False free=False new=False | 0.18/0.75 | no_data None% ttft=Nonems lat=Nonems calls=0 | 3.3 (4) | fn=True reasoning=True cache=True | desc: Tencent's cheap model huh? Feedback needed
- Tencent Hy4 Preview | hy4-preview | hy4-preview | openrouter | tencent | 1048576 | premium=False free=False new=True | 1.08/3.25 | healthy 100% ttft=4404ms lat=59754ms calls=3 | None (None) | fn=True reasoning=True cache=True | desc: None
- Aion 3.0 Mini | aion-3.0-mini | aion-labs/aion-3.0-mini | openrouter | aion-labs | 131000 | premium=False free=False new=False | 0.91/1.82 | healthy 100% ttft=1188ms lat=14756ms calls=1 | 3.5 (6) | fn=False reasoning=True cache=True | desc: Claimed to be a model that's trained for storytelling
- Aion 3.0 | aion-3.0 | aion-labs/aion-3.0 | openrouter | aion-labs | 131000 | premium=True free=False new=False | 3.9/7.8 | no_data None% ttft=Nonems lat=Nonems calls=0 | 3 (2) | fn=False reasoning=True cache=True | desc: Claimed to be a model that's trained for storytelling
- MiniMax M3 | minimax-m3 | minimax/minimax-m3 | infron | minimax | 1000000 | premium=False free=False new=None | 0.39/1.56 | healthy 100% ttft=8421ms lat=26818ms calls=30 | 2.9 (16) | fn=True reasoning=True cache=True | desc: Quite good model with strong reasoning
- MiniMax M3 | minimax-m3 | minimax-m3 | minimax | minimax | 1000000 | premium=False free=False new=None | 0.39/1.56 | healthy 100% ttft=1547ms lat=8078ms calls=20 | 2.9 (16) | fn=True reasoning=True cache=True | desc: Quite good model with strong reasoning
- MiniMax M3 | minimax-m3 | minimax-m3 | openrouter | minimax | 1000000 | premium=False free=False new=None | 0.39/1.56 | healthy 100% ttft=1908ms lat=4122ms calls=7 | 2.9 (16) | fn=True reasoning=True cache=True | desc: Quite good model with strong reasoning
- MiniMax M2.7 | minimax-m2.7 | minimax-m2.7 | openrouter | minimax | 204800 | premium=False free=False new=None | 0.39/1.56 | healthy 100% ttft=2002ms lat=19831ms calls=30 | 3.3 (4) | fn=True reasoning=True cache=True | desc: Probably the best alternative with really good reasoning!
- Qwen 3.5 9B | qwen3.5-9b | qwen3.5-9b | dedicated-z | qwen | 65536 | premium=False free=False new=None | 0.13/0.2 | no_data None% ttft=Nonems lat=Nonems calls=0 | 3 (4) | fn=False reasoning=True cache=True | desc: Very capable small and cheap model. Worth a try!
- Qwen 3.6 35B | qwen3.6-35b-abliterated | qwen3.6-35b-a3b-abliterated-awq | dedicated-z | qwen | 65536 | premium=False free=False new=False | 0.2/1.3 | no_data None% ttft=Nonems lat=Nonems calls=0 | 3 (1) | fn=True reasoning=True cache=True | desc: Qwen 3.6 35B a3b-abliterated, uncensored mid-size model. Worth a try!
- Qwen 3.5 9B (Unlimited) | qwen3.5-9b-free | qwen3.5-9b | dedicated-z | qwen | 65536 | premium=False free=True new=None | 0.13/0.2 | healthy 100% ttft=4530ms lat=9168ms calls=132 | 1.7 (6) | fn=False reasoning=False cache=True | desc: Uncensored. It's not great but it's unlimited usage no daily limits for now.
- Qwen 3.6 35B | qwen3.6-35b-abliterated-free | qwen3.6-35b-a3b-abliterated-awq | dedicated-z | qwen | 65536 | premium=False free=True new=False | 0.2/1.3 | healthy 100% ttft=10515ms lat=28946ms calls=118 | 2 (3) | fn=False reasoning=False cache=True | desc: Qwen 3.6 35B a3b-abliterated, uncensored. Free for now, might go away later. Feedback welcome at discord!
- MiMo-V2.5 | mimo-v2.5-free | xiaomi/mimo-v2.5 | dedicated | xiaomi | 30000 | premium=False free=True new=False | 0.18/0.36 | healthy 100% ttft=5285ms lat=16905ms calls=533 | 4.5 (8) | fn=False reasoning=False cache=True | desc: Community's favourite model for roleplay based on our poll. We are testing it as a free model for now, it might go away later.
- DeepSeek V4 Flash 0731 | deepseek-v4-flash-0731-free | deepseek-v4-flash-0731 | dedicated-d | deepseek | 30000 | premium=False free=True new=None | 0.19/0.38 | healthy 100% ttft=2179ms lat=7334ms calls=339 | 2.9 (20) | fn=False reasoning=False cache=True | desc: The long awaited Deepseek v4 is here!
- ERNIE 5.1 Preview | ernie-5.1-preview-free | ernie-5.1-preview | baidu | baidu | 40000 | premium=False free=True new=None | 0.36/1.61 | degraded 88.52% ttft=5634ms lat=11701ms calls=61 | 3 (3) | fn=False reasoning=False cache=False | desc: Free, but might go away anytime. Leave your feedback at discord!
- ERNIE 4.5 Turbo | ernie-4.5-turbo | ernie-4.5-turbo-128k | baidu | baidu | 40000 | premium=False free=True new=None | 0/0 | healthy 100% ttft=4301ms lat=10889ms calls=6 | None (None) | fn=False reasoning=False cache=False | desc: Baidu turbo model? free for now but may go anytime.

Provider filter chips (modelProvider values, in site order): All, Deepseek, Xiaomi, Z-Ai, Moonshotai, Qwen, Google, X-Ai, Anthropic, Meta, Tencent, Aion-Labs, Minimax, Baidu

apiProvider values: baidu, byteplus, dedicated, dedicated-b, dedicated-d, dedicated-z, infron, inworld, minimax, openrouter

Mana conversion: displayed 'Mana / Arcane' = USD cost with markup × 100 (e.g. 0.286 $/M → 28.6 Mana). Guest gets 20 free Mana.

## Image model object shape

```json
{
 "sizeConfig": {
  "customDimensions": {
   "enabled": true,
   "minWidth": 256,
   "maxWidth": 1536,
   "minHeight": 256,
   "maxHeight": 1536,
   "multiplier": 1
  },
  "presets": [
   {
    "_id": "6aa8897f5c9e6e572adbbd93",
    "key": "3:4",
    "label": "Portrait Standard",
    "width": 896,
    "height": 1152,
    "aspectRatio": "3:4",
    "orientation": "portrait",
    "order": 0
   },
   {
    "_id": "6aa8897f5c9e6e572adbbd94",
    "key": "1:1",
    "label": "Square",
    "width": 1024,
    "height": 1024,
    "aspectRatio": "1:1",
    "orientation": "square",
    "order": 1
   },
   {
    "_id": "6aa8897f5c9e6e572adbbd95",
    "key": "9:16",
    "label": "Portrait",
    "width": 768,
    "height": 1344,
    "aspectRatio": "9:16",
    "orientation": "portrait",
    "order": 2
   },
   {
    "_id": "6aa8897f5c9e6e572adbbd96",
    "key": "4:3",
    "label": "Standard",
    "width": 1152,
    "height": 896,
    "aspectRatio": "4:3",
    "orientation": "landscape",
    "order": 3
   },
   {
    "_id": "6aa8897f5c9e6e572adbbd97",
    "key": "3:2",
    "label": "Photo",
    "width": 1024,
    "height": 640,
    "aspectRatio": "3:2",
    "orientation": "landscape",
    "order": 4
   },
   {
    "_id": "6aa8897f5c9e6e572adbbd98",
    "key": "2:3",
    "label": "Portrait Photo",
    "width": 640,
    "height": 1024,
    "aspectRatio": "2:3",
    "orientation": "portrait",
    "order": 5
   },
   {
    "_id": "6aa8897f5c9e6e572adbbd99",
    "key": "21:9",
    "label": "Ultra Wide",
    "width": 1536,
    "height": 640,
    "aspectRatio": "21:9",
    "orientation": "landscape",
    "order": 6
   },
   {
    "_id": "6aa8897f5c9e6e572adbbd9a",
    "key": "16:9",
    "label": "Landscape",
    "width": 1344,
    "height": 768,
    "aspectRatio": "16:9",
    "orientation": "landscape",
    "order": 7
   },
   {
    "_id": "6aa8897f5c9e6e572adbbd9b",
    "key": "9:21",
    "label": "Ultra Tall",
    "width": 640,
    "height": 1536,
    "aspectRatio": "9:21",
    "orientation": "portrait",
    "order": 8
   }
  ]
 },
 "qualityConfig": {
  "enabled": false,
  "options": []
 },
 "referenceImageConfig": {
  "enabled": true,
  "maxReferenceImages": 3
 },
 "lightNovelDefault": false,
 "mangaReady": false,
 "mangaDefault": false,
 "_id": "69add2331f6e3564f660a582",
 "visibility": "public",
 "actions": [
  "edit",
  "generate"
 ],
 "name": "Grok Imagine Image",
 "model": "grok-imagine-image",
 "description": "In the cheap tier, this is the best model! Up to 3 reference images. 1K resolution.",
 "apiProvider": "grok",
 "modelProvider": "x-ai",
 "iconUrl": "https://storage.googleapis.com/isekai-zero-production/uploads%2FllmIcon%2F68f7f5e440c0ba2414f892c7%2F30ec7cdf-2d00-4d43-96bf-d7f91e93a2e3.webp",
 "costPerImage": 0.02,
 "markupPercent": 30,
 "order": -100,
 "premium": false,
 "default": false,
 "deleted": false,
 "costPerInputImage": 0.002,
 "visualNovelReady": true,
 "visualNovelDefault": true,
 "lightNovelReady": true,
 "updatedAt": "2026-08-15T03:15:00.000Z",
 "costWithMarkup": 0.03,
 "id": "69add2331f6e3564f660a582"
}
```

## Image model catalog

- Grok Imagine Image | grok-imagine-image | grok | x-ai | $0.03 (3.0 Mana) | actions=['edit', 'generate'] | vn=True illustration=True manga=False | premium=False | refImgs=True max=3 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: In the cheap tier, this is the best model! Up to 3 reference images. 1K resolution.
- Qwen Image 3.0 | qwen/qwen-image-3.0 | infron | qwen | $0.04 (4.0 Mana) | actions=['generate', 'edit'] | vn=True illustration=True manga=False | premium=False | refImgs=True max=3 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21', 'portrait-2k', 'square-2k', 'landscape-2k'] | desc: Uncensored. Alibaba's newest image model, strong prompt adherence and text rendering. Up to 3 reference images. 1K resolution, up to 2K.
- Wan 2.7 Image | wan/wan2.7 | infron | alibaba | $0.04 (4.0 Mana) | actions=['generate', 'edit'] | vn=True illustration=True manga=False | premium=False | refImgs=True max=9 | presets=['portrait', 'square', 'landscape', 'wide', 'tall'] | desc: Fast and best performing for it's price but generation quality is not consistenly good. Up to 9 reference images. 2K resolution.
- Grok Imagine Image 2.0 | grok-imagine-image-2.0 | grok | x-ai | $0.05 (5.0 Mana) | actions=['edit', 'generate'] | vn=True illustration=True manga=False | premium=False | refImgs=True max=5 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: xAI's newest image model. Up to 5 reference images. 1K resolution.
- Qwen Image 3.0 Pro | qwen/qwen-image-3.0/pro | infron | qwen | $0.05 (5.0 Mana) | actions=['generate', 'edit'] | vn=True illustration=True manga=False | premium=False | refImgs=True max=3 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Uncensored. Pro version of Qwen Image 3.0 with higher quality output. 1K resolution. Up to 3 reference images.
- Nano Banana 2 Lite | google/nano-banana-2-lite | infron | google | $0.05 (5.0 Mana) | actions=['generate', 'edit'] | vn=True illustration=True manga=True | premium=False | refImgs=True max=14 | presets=['square', 'portrait', 'landscape', 'wide', 'tall', 'portrait-2-3', 'landscape-3-2', 'portrait-4-5', 'landscape-5-4', 'ultrawide'] | desc: Google Nano Banana 2 Lite (Gemini 3.1 Flash Lite Image): Pro-quality generation and editing at Flash speed, character consistency for up to 5 characters. Up to 14 reference images. 1K resolution.
- 851 Labs | 851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc | replicate | 851-labs | $0.001 (0.1 Mana) | actions=['remove-background'] | vn=False illustration=False manga=False | premium=False | refImgs=False max=1 | presets=[] | desc: Remove backgrounds from images.
- Qwen Image Edit 2511 | qwen-image/edit-2511 | wavespeed | qwen | $0.02 (2.0 Mana) | actions=['edit'] | vn=True illustration=False manga=False | premium=False | refImgs=True max=3 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Qwen Image Edit 2511 is a major upgrade over 2509 for real-world image editing and design. It delivers stronger edit consistency, robust multi-person identity/pose consistency, built-in LoRA styles, enhanced industrial/product design, and improved geometric reasoning for structure-preserving edits. Up to 3 reference images. 1K resolution.
- Toonout | rmbg | comfyui | briaai | $0.001 (0.1 Mana) | actions=['remove-background'] | vn=False illustration=False manga=False | premium=False | refImgs=False max=1 | presets=[] | desc: Fast fine tuned characters background removal
- Seedream 5 Pro | ep-20260710042232-zp9xh | byteplus | bytedance | $0.06 (6.0 Mana) | actions=['edit', 'generate'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=10 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Uncensored, cheap and very capable but very very slow. Up to 10 reference images. 2K resolution.
- Seedream 4.5 | seedream-4-5-251128 | byteplus | bytedance | $0.05 (5.0 Mana) | actions=['edit', 'generate'] | vn=False illustration=True manga=False | premium=False | refImgs=True max=10 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Lightly censored, good value for money model, balance between speed and performance. Up to 10 reference images. 2K resolution.
- Seedream 5 Lite | seedream-5-0-260128 | byteplus | bytedance | $0.05 (5.0 Mana) | actions=['edit', 'generate'] | vn=False illustration=True manga=False | premium=False | refImgs=True max=10 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Lightly censored, good value for money model, balance between speed and performance but pretty slow. Up to 10 reference images. 2K resolution.
- Nano Banana 2 Edit (1k) | google/nano-banana-2 | infron | google | $0.09 (9.0 Mana) | actions=['generate', 'edit'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=14 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: [1k Resolution] This is probably the 2nd best model right now it's very censored but the performance is comparable to the pro version and its half the price. Up to 14 reference images.
- Nano Banana 2 Edit (2k) | google/nano-banana-2 | infron | google | $0.14 (14.0 Mana) | actions=['generate', 'edit'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=14 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: This is probably the 2nd best model right now it's very censored but the performance is comparable to the pro version and its half the price. Up to 14 reference images. 2K resolution.
- Nano Banana Pro Edit | google/nano-banana-pro | infron | google | $0.2 (20.0 Mana) | actions=['generate', 'edit'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=14 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Google's best image editing model. Up to 14 reference images. 2K resolution.
- GPT Image 2 | openai/gpt-image-2 | infron | openai | $0.07 (7.0 Mana) | actions=['generate', 'edit'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=5 | presets=['square', 'portrait', 'landscape', 'wide', 'square-2k'] | desc: OpenAI GPT Image 2, strong at following complex instructions and text in images. Medium quality. Up to 5 reference images. 1K resolution, up to 2K.
- GPT Image 2.5 Flare | openai/gpt-image-2.5-flare | infron | openai | $0.02 (2.0 Mana) | actions=['generate', 'edit'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=5 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21', 'portrait-2k', 'square-2k', 'landscape-2k'] | desc: OpenAI GPT Image 2.5 Flare, the fast default model with natural lighting, rich textures and strong text rendering. Medium quality. Up to 5 reference images. 1K resolution, up to 2K.
- GPT Image 2.5 Sunburst | openai/gpt-image-2.5-sunburst | infron | openai | $0.02 (2.0 Mana) | actions=['generate', 'edit'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=5 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21', 'portrait-2k', 'square-2k', 'landscape-2k'] | desc: OpenAI GPT Image 2.5 Sunburst, the precision model with extra fidelity on intricate detail and the tightest edit control, slower than Flare. Medium quality. Up to 5 reference images. 1K resolution, up to 2K.
- Qwen Image 2512 | qwen-image-2512 | runware | qwen | $0.01 (1.0 Mana) | actions=['generate'] | vn=False illustration=False manga=False | premium=False | refImgs=False max=1 | presets=['3:4', '1:1', '21:9', '16:9', '4:3', '3:2', '2:3', '9:16', '9:21'] | desc: An image generation foundation model in the Qwen series that achieves significant advances in complex text rendering. 1K resolution.
- Qwen Image 2.0 | qwen-image-2.0 | qwen | qwen | $0.03 (3.0 Mana) | actions=['edit', 'generate'] | vn=True illustration=False manga=False | premium=False | refImgs=True max=3 | presets=['3:4', '1:1', '21:9', '16:9', '4:3', '3:2', '2:3', '9:16', '9:21'] | desc: Least censored, latest qwen model. Up to 3 reference images. 1K resolution.
- Z Image Turbo | z-image/turbo | runware | z-image | $0.005 (0.5 Mana) | actions=['generate'] | vn=True illustration=False manga=False | premium=False | refImgs=False max=1 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Z Image Turbo is a 6 billion parameter text-to-image model that generates photorealistic images in sub-second time. 1K resolution.
- Qwen Image | qwen-image | runware | qwen | $0.01 (1.0 Mana) | actions=['generate'] | vn=True illustration=False manga=False | premium=False | refImgs=False max=1 | presets=['3:4', '1:1', '21:9', '16:9', '4:3', '3:2', '2:3', '9:16', '9:21'] | desc: An image generation foundation model in the Qwen series that achieves significant advances in complex text rendering. 1K resolution.
- Qwen Image Edit Plus | qwen-image-edit-plus | wavespeed | qwen | $0.02 (2.0 Mana) | actions=['edit'] | vn=False illustration=False manga=False | premium=False | refImgs=True max=3 | presets=['1:1', '21:9', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '9:21'] | desc: The latest Qwen-Image's iteration with improved multi-image editing, single-image consistency, and native support for ControlNet. Up to 3 reference images. 1K resolution.
- Wan 2.7 Image Pro | wan/wan2.7/pro | infron | alibaba | $0.09 (9.0 Mana) | actions=['generate', 'edit'] | vn=True illustration=True manga=False | premium=True | refImgs=True max=9 | presets=['portrait', 'square', 'landscape', 'wide', 'tall'] | desc: Fast and capable model, uncensored. Up to 9 reference images. 2K resolution.
- Qwen Image 2512 | qwen-image/text-to-image-2512 | wavespeed | qwen | $0.02 (2.0 Mana) | actions=['generate'] | vn=True illustration=False manga=False | premium=False | refImgs=False max=1 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Qwen Image 2512 is Alibaba Qwen's latest text-to-image model with enhanced prompt understanding, superior text rendering, and versatile aspect ratio support. 1K resolution.
- Grok Imagine Image Pro | grok-imagine-image-pro | grok | x-ai | $0.09 (9.0 Mana) | actions=['edit', 'generate'] | vn=False illustration=False manga=False | premium=False | refImgs=True max=3 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Best grok image gen! Up to 3 reference images. 1K resolution.
- Kling Omni Image O1 | kwaivgi/kling-image-o1 | wavespeed | kwaivgi | $0.028 (2.8 Mana) | actions=['generate', 'edit'] | vn=False illustration=False manga=False | premium=False | refImgs=True max=10 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Kling Omni Image O1 is Kuaishou's multi-modal image generation model with MVL technology. Supports up to 10 reference images for feature consistency, precise detail editing (add/remove/modify), style control, and series content creation. Perfect for IP character design, comic panels, and brand merchandise. 1K resolution.
- Muse Image | meta/muse-image | wavespeed | meta | $0.01 (1.0 Mana) | actions=['generate', 'edit'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=10 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Meta Muse Image via Wavespeed. Strong multi-character consistency and exact speech-bubble text for manga pages and light novel illustrations. Slow: 40 to 120 seconds per image. Up to 10 reference images. 2K resolution.
- Nano Banana Pro Edit (Backup) | google/nano-banana-pro/edit | wavespeed | google | $0.2 (20.0 Mana) | actions=['edit'] | vn=False illustration=True manga=True | premium=False | refImgs=True max=14 | presets=['3:4', '1:1', '9:16', '4:3', '3:2', '2:3', '21:9', '16:9', '9:21'] | desc: Google's best image editing model. Up to 14 reference images. 2K resolution.
