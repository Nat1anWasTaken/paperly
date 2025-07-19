from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import utils
from src.routers import papers, analyses, summaries, chat, translations

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(papers.router)
app.include_router(analyses.router)
app.include_router(summaries.router)
app.include_router(chat.router)
app.include_router(translations.router)
app.include_router(utils.router)


@app.get("/")
async def root():
    return {"version": "0.1.0", "message": "Welcome to Paperly API!"}
