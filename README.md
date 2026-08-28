# 📄 AI-Document-Based Q&A — RAG Application

An AI-powered **Document Question-Answering application** built using **React, FastAPI, LangChain, Ollama, and ChromaDB**.

Users can upload a PDF document and ask questions about its content. The application retrieves relevant sections from the document and uses an LLM to generate an answer based only on the retrieved context.

## 🚀 Features

* 📄 Upload PDF documents
* ✅ Basic PDF validation
* 🔍 Duplicate document detection using SHA-256 hashing
* ✂️ Text extraction and chunking
* 🧠 Document embeddings using `nomic-embed-text`
* 🗄️ Vector storage and similarity search using ChromaDB
* 🤖 Question answering using Llama 3.2
* 🔎 Retrieval-Augmented Generation (RAG)
* 🌐 React frontend
* ⚡ FastAPI backend

## 🏗️ RAG Architecture

```text
                    PDF Upload
                        │
                        ▼
                PDF Validation
                        │
                        ▼
                 Duplicate Check
                        │
                        ▼
                  Text Extraction
                        │
                        ▼
                  Text Chunking
                        │
                        ▼
              Nomic Embeddings
                        │
                        ▼
                    ChromaDB
                  Vector Store
                        │
                        │
              ┌─────────▼─────────┐
              │   User Question   │
              └─────────┬─────────┘
                        │
                        ▼
                Similarity Search
                        │
                        ▼
                Relevant Chunks
                        │
                        ▼
                     Prompt
                        │
                        ▼
                   Llama 3.2
                        │
                        ▼
                  Final Answer
```

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Python
* FastAPI
* Uvicorn
* PyPDF

### RAG / AI

* LangChain
* Ollama
* `nomic-embed-text`
* Llama 3.2
* ChromaDB

## 📁 Project Structure

```text
document-based-q-and-a/
│
├── backend/
│   └── app/
│       ├── main.py
│       ├── uploads/
│       ├── chroma_db/
│       └── documents.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

> `uploads/`, `chroma_db/`, and `documents.json` are local runtime data and should not be committed to Git.

## ⚙️ Requirements

Make sure the following are installed:

* Python 3.10+
* Node.js
* Ollama

The following Ollama models are required:

```text
nomic-embed-text
llama3.2
```

## ▶️ Run the Backend

Navigate to the backend directory:

```bash
cd backend
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

## ▶️ Run the Frontend

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## 🔌 API Endpoints

### Upload Document

```http
POST /api/documents/upload
```

Accepts a PDF using multipart form data:

```text
file
```

The backend:

1. Validates the PDF
2. Checks for duplicates
3. Extracts text
4. Splits the text into chunks
5. Generates embeddings
6. Stores the chunks and embeddings in ChromaDB

### Ask Question

```http
POST /api/documents/ask
```

Request:

```json
{
  "question": "What does this document contain?"
}
```

The backend performs similarity search against ChromaDB and sends the retrieved context to Llama 3.2.

## 🔐 Duplicate Detection

Uploaded PDFs are identified using a **SHA-256 file hash**.

If the exact same PDF is uploaded again, the backend detects the existing hash and returns a duplicate response instead of processing the document again.

## 🧠 Why RAG?

Instead of sending the entire document directly to the LLM, this application uses Retrieval-Augmented Generation:

```text
Question
   ↓
Semantic Search
   ↓
Relevant Document Chunks
   ↓
LLM Context
   ↓
Grounded Answer
```

This helps the LLM answer questions using the uploaded document rather than relying only on its general knowledge.

## 📌 Current Status

This project is being developed as a practical **Retrieval-Augmented Generation (RAG)** application to demonstrate:

* Document ingestion
* Text chunking
* Embeddings
* Vector databases
* Semantic retrieval
* LLM-based question answering
* React + FastAPI integration

## 🔮 Future Improvements

* Streaming LLM responses
* Source/page citations
* Multiple document selection
* Retrieval score thresholding
* Better PDF parsing
* Conversation history
* Improved error handling
* Production deployment
* Authentication and user-specific document storage
