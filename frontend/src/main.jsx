import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const FileGlyph = () => <span className="file-glyph" aria-hidden="true">PDF</span>
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// Provides the PDF upload, question form, and FastAPI-powered answer display.
function App() {
  const input = useRef(null)
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [fileHash, setFileHash] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [source, setSource] = useState('')
  const [documentText, setDocumentText] = useState('')
  const [error, setError] = useState('')
  const [asking, setAsking] = useState(false)

  const handlePointerMove = (event) => {
    const x = ((event.clientX / window.innerWidth) - 0.5) * 2
    const y = ((event.clientY / window.innerHeight) - 0.5) * 2
    event.currentTarget.style.setProperty('--pointer-x', `${(x * 6).toFixed(2)}px`)
    event.currentTarget.style.setProperty('--pointer-y', `${(y * 6).toFixed(2)}px`)
  }

  const chooseFile = (event) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) return setError('Please choose a PDF file.')
    setFile(selected); setAnswer(''); setUploadMessage(''); setSource(''); setDocumentText(''); setError('')
  }


  const uploadDocument = async () => {
  if (!file) {
    return setError('Please choose a PDF.')
  }

  setAsking(true)
  setError('')
  setUploadMessage('')

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      `${API_BASE_URL}/api/documents/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const data = await response.json()
    console.log("API RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data.detail || 'Upload failed.')
    }

    setUploadMessage(data.message || 'PDF uploaded successfully.')
    setDocumentText(data.text || 'No readable text was found in this PDF.')
    setSource(data.filename || file.name)
    setFileHash(data.file_hash || '')
    
   
  } catch (error) {
    setError(
      error.message.includes('Failed to fetch')
        ? 'FastAPI is not running on port 8000.'
        : error.message
    )
  } finally {
    setAsking(false)
  }
}



  const askQuestion = async (event) => {
    event.preventDefault();

    if(!question.trim()){
      return setError("Please Enter a question.")
    }

    setError("")
    setAsking(true)

    try {
      const response = await fetch ( `${API_BASE_URL}/api/documents/ask`,
        {
          method : "POST",
          headers : {
            "Content-Type" : "application/json"
          },
          body : JSON.stringify({
            question:question,
            file_hash: fileHash,
          }),
        }
      );

      const data = await response.json();
      console.log(data);

      if(!response.ok){
        throw new Error(data.detail || "Question Failed")
      }

      setAnswer(data.answer)

    }catch(error){
      console.log("Error", error)
      setError(error.message)
    }finally{
      setAsking(false)
    }
  }

  return (
    <main className="page-shell" onPointerMove={handlePointerMove}>
      <div className="grain" aria-hidden="true" />

      <section className="workspace">
        <div className="project-logo">
          <img
            src="/policy_pdf.png"
            alt="Question and answer illustration for document-based questions"
          />
        </div>
        <div className="intro">
          <div>
            
            <h1>
              Ask your documents
              <br />
              <em>anything.</em>
            </h1>
          </div>
        
        </div>

        <div className="interaction-grid">
          <section className="panel">
            <div className="panel-heading">
              <span>01</span>
              <h2>Bring a document</h2>
            </div>
            <input
              ref={input}
              type="file"
              accept="application/pdf,.pdf"
              onChange={chooseFile}
              hidden
            />
            <button
              className={`dropzone ${file ? 'has-file' : ''}`}
              onClick={() => input.current?.click()}
              type="button"
            >
              <span className="upload-icon">
                {file ? <FileGlyph /> : '+'}
              </span>
              {file ? (
                <>
                  <strong>{file.name}</strong>
                  <small>
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF ready
                  </small>
                </>
              ) : (
                <>
                  <strong>Choose a PDF</strong>
                  <small>Drop it here or click to browse</small>
                </>
              )}
            </button>
            <div className="panel-note">
              <b>⌁</b> PDF files only · up to 10 MB
            </div>
            <button
              className="ask-button upload-ask-button"
              disabled={asking}
              onClick={uploadDocument}
              type="button"
            >
              {asking ? 'Uploading...' : 'Upload PDF'} <span>↗</span>
            </button>
           
          </section>
           {uploadMessage && (
              <p className="upload-success" role="status">{uploadMessage}</p>
            )}

          {documentText && (
            <section className="panel exploring-panel">
              <div className="panel-heading">
                <span>02</span>
                <h2>Start exploring</h2>
              </div>
              <form id="question-form" onSubmit={askQuestion}>
                <label htmlFor="question">Your question</label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="What would you like to know?"
                  rows="5"
                />
                <button className="ask-button here" disabled={asking} type="submit">
                  {asking ? 'Thinking...' : 'Ask question'} <span>↗</span>
                </button>
              </form>
            </section>
          )}
        </div>

       

        {(error || (answer && answer !== uploadMessage)) && (
          <section
            className={`panel answer-panel ${error ? 'has-error' : ''}`}
            aria-live="polite">
            
            {error ? (
              <p className="error">{error}</p>
            ) : (
              <>
                <p className="answer" style={{ WhiteSpace : 'pre-line'}}>{answer}</p>
                <div className="source">
                  <FileGlyph />
                  <span>
                    <b>{source}</b>
                    <small>Matched document source</small>
                  </span>
                </div>
              </>
            )}
          </section>
        )}

         {documentText && (
          <section className="panel document-text-panel" aria-live="polite">
            <div className="panel-heading">
              <span>03</span>
              <h2>Document text</h2>
            </div>
            <pre className="document-text">{documentText}</pre>
          </section>
        )}

      </section>

     
    </main>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)