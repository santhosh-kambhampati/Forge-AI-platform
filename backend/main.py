import fitz

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from openai import OpenAI

from workflows.summary import get_prompt as summary_prompt
from workflows.keypoints import get_prompt as keypoints_prompt
from workflows.studynotes import get_prompt as studynotes_prompt
from workflows.interview import get_prompt as interview_prompt

from utils import chunk_text_with_pages

from rag import (
    store_chunks,
    retrieve_chunks
)

client = OpenAI(
    api_key="ollama",
    base_url="http://localhost:11434/v1"
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKFLOW_MAP = {
    "Document Summary": summary_prompt,
    "Key Points": keypoints_prompt,
    "Study Notes": studynotes_prompt,
    "Interview Questions": interview_prompt,
}

@app.get("/")
def home():
    return {
        "message": "Forge backend running"
    }

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    workflow: str = Form(...)
):

    pdf_bytes = await file.read()

    doc = fitz.open(
        stream=pdf_bytes,
        filetype="pdf"
    )

    extracted_text = ""

    pages = []

    for page_number, page in enumerate(doc):

        text = page.get_text()

        extracted_text += text

        pages.append(
            (
                page_number + 1,
                text
            )
        )

    chunks = chunk_text_with_pages(
        pages
    )

    store_chunks(
    chunks,
    file.filename
)

    workflow_handler = WORKFLOW_MAP.get(
        workflow,
        summary_prompt
    )

    def generate_stream():

        try:

            if not extracted_text.strip():
                yield "No text could be extracted from this PDF."
                return

            prompt = workflow_handler(
                extracted_text[:12000]
            )

            print("Starting AI stream...")

            stream = client.chat.completions.create(
                model="llama3",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an advanced AI workflow assistant. "
                            "Generate clean structured output."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                stream=True
            )

            for chunk in stream:

                content = (
                    chunk
                    .choices[0]
                    .delta
                    .content
                )

                if content:
                    yield content

        except Exception as error:
            print("UPLOAD STREAM ERROR:", error)
            yield f"Upload processing failed: {str(error)}"

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain"
    )

@app.post("/ask")
async def ask_question(
    question: str = Form(...)
):

    relevant_chunks = retrieve_chunks(
        question
    )

    context = "\n\n".join([
    f"""
Document: {chunk['document']}
Page: {chunk['page']}

{chunk['text']}
"""
    for chunk in relevant_chunks
])

    sources = list(set([
        chunk["page"]
        for chunk in relevant_chunks
    ]))

    prompt = f"""
Answer the question using the context below.

Context:
{context}

Question:
{question}

At the end include a section called:

Sources:

For every source used provide:
- document name
- page number
- short supporting snippet
"""

    stream = client.chat.completions.create(
        model="llama3",
        messages=[
            {
                "role": "system",
                "content":
                "You answer questions using retrieved document context."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        stream=True
    )

    def generate_answer():

        for chunk in stream:

            content = (
                chunk
                .choices[0]
                .delta
                .content
            )

            if content:
                yield content

    return StreamingResponse(
        generate_answer(),
        media_type="text/plain"
    )