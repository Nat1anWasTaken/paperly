from fastapi import FastAPI

from src.routers import papers, analyses

app = FastAPI()

app.include_router(papers.router)
app.include_router(analyses.router)

@app.get("/")
async def root():
    return {"version": "0.1.0", "message": "Welcome to Paperly API!"}