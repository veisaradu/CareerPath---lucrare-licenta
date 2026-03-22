from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from extractor import extract_text_from_file
from skill_matcher import match_skills
from experience_parser import parse_experience
from education_parser import parse_education

app = FastAPI(title="CareerPath ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/process-cv")
async def process_cv(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed = {".pdf", ".doc", ".docx"}
    suffix = "." + file.filename.rsplit(".", 1)[-1].lower()
    if suffix not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {suffix}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  
        raise HTTPException(
            status_code=400, detail="File too large (max 10MB)"
        )

    text = extract_text_from_file(file_bytes, file.filename)
    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from file",
        )

    skills = match_skills(text)
    experience = parse_experience(text)
    education = parse_education(text)

    return {
        "extracted_text": text,
        "skills": skills,
        "experience": experience,
        "education": education,
        "skill_count": len(skills),
    }