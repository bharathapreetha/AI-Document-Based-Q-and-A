from fastapi import FastAPI, UploadFile, File,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_chroma import Chroma
from pydantic import BaseModel
from io import BytesIO
import hashlib
import json


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
CHROMA_DIR = BASE_DIR / "chroma_db"
DOCUMENT_FILE = BASE_DIR / "documents.json"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class QuestionRequest(BaseModel):
    question :str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Document Upload
@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):

    # Basic validation
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are allowed")

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(400, "The uploaded file is empty")

    # Validate PDF
    try:
        reader = PdfReader(BytesIO(file_bytes))
    except Exception:
        raise HTTPException(400, "Invalid or corrupted PDF")

    if not reader.pages:
        raise HTTPException(400, "PDF contains no pages")

    # Duplicate check
    file_hash = calculate_file_hash(file_bytes)
    documents = load_documents()

    if file_hash in documents:
        return {
            "status": "duplicate",
            "message": "This document has already been uploaded.",
            "filename": documents[file_hash]["filename"]
        }

    # Save PDF
    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # RAG ingestion
    chunks = ingest_document(file_path, file.filename, file_hash)

    # Save document metadata
    documents[file_hash] = {
        "filename": file.filename,
        "pages": len(reader.pages),
        "chunks": len(chunks)
    }

    save_documents(documents)

    return {
        "status": "success",
        "message": "Document uploaded and processed successfully.",
        "filename": file.filename,
        "pages": len(reader.pages),
        "chunks": len(chunks)
    }
    

# Receive question from front end
@app.post('/api/documents/ask')
async def ask_question(request: QuestionRequest):

    # Embedding
    embeddings = OllamaEmbeddings(
        model="nomic-embed-text"
    )
    
    # LLM
    llm = OllamaLLM(
        model = "llama3.2"
    )
    
    # Connect to Chroma
    vectorstore = Chroma(
        collection_name = "pdf_documents",
        embedding_function = embeddings,
        persist_directory = str(CHROMA_DIR)
    )
    
    results = vectorstore.similarity_search(request.question, k=4)
    
    context = "\n\n".join(
        doc.page_content for doc in results
    )
    
    # Prompt
    prompt = f"""
        You are a document question-answering assistant.

        Answer the user's question ONLY using the provided context.

        If the answer cannot be found in the context, say:
        "I could not find the answer in the provided document."

        Do not use your own knowledge.
        Do not make up information.

        Context:
        {context}

        Question:
        {request.question}

        Answer:
          """
    # Call LLM
    response = llm.invoke(prompt)
    
    return {
        "question": request.question,
        "answer": response,
        "context": context
    }
    
# RAG Begins
def ingest_document(file_path, filename, file_hash):
   
    text = extract_text_from_pdf(file_path)

    if not text.strip():
        raise HTTPException(
            400,
            "PDF does not contain readable text"
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_text(text)


    embeddings = OllamaEmbeddings(
        model="nomic-embed-text"
    )

    vectorstore = Chroma(
        collection_name="pdf_documents",
        embedding_function=embeddings,
        persist_directory=str(CHROMA_DIR)
    )

    vectorstore.add_texts(
        texts=chunks,
        metadatas=[
            {
                "filename": filename,
                "file_hash": file_hash
            }
            for _ in chunks
        ]
    )

    return chunks

#Read Text of PDF
def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    text =""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


# File Hash
def calculate_file_hash(file_bytes : bytes) ->str:
    return hashlib.sha256(file_bytes).hexdigest()

# Document meta data management
def load_documents():
    if not DOCUMENT_FILE.exists() or DOCUMENT_FILE.stat().st_size == 0:
        return {}

    try:
        with open(DOCUMENT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}

# Save document metadata
def save_documents(documents):
    DOCUMENT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DOCUMENT_FILE, "w", encoding="utf-8") as f:
        json.dump(documents, f, indent=4)
        