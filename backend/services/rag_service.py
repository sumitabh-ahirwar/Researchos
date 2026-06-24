import re
import uuid
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from langchain.tools import tool
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_mistralai import MistralAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BASE_DIR / "storage" / "uploads"
CHROMA_DIR = BASE_DIR / "storage" / "chroma_db"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

COLLECTION_NAME = "uploaded_pdf_reports"


def get_embeddings() -> MistralAIEmbeddings:
    return MistralAIEmbeddings(model="mistral-embed")


def get_vector_store() -> Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=get_embeddings(),
        persist_directory=str(CHROMA_DIR),
    )


def _safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", filename.strip())
    return cleaned or "uploaded.pdf"


def save_uploaded_pdf(file_bytes: bytes, original_filename: str) -> Dict[str, str]:
    document_id = str(uuid.uuid4())
    safe_filename = _safe_filename(original_filename)
    file_path = UPLOAD_DIR / f"{document_id}_{safe_filename}"

    with open(file_path, "wb") as file:
        file.write(file_bytes)

    return {
        "document_id": document_id,
        "file_path": str(file_path),
        "filename": original_filename,
    }


def ingest_pdf(file_path: str, document_id: str, filename: str) -> Dict[str, Any]:
    """
    Convert a PDF into chunks, embed those chunks, and store them in ChromaDB.
    """
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    for doc in documents:
        doc.metadata["document_id"] = document_id
        doc.metadata["filename"] = filename
        doc.metadata["source"] = filename

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    chunks = splitter.split_documents(documents)

    vector_store = get_vector_store()
    chunk_ids = [f"{document_id}:{index}" for index, _ in enumerate(chunks)]
    vector_store.add_documents(chunks, ids=chunk_ids)

    return {
        "document_id": document_id,
        "filename": filename,
        "pages": len(documents),
        "chunks": len(chunks),
        "message": "PDF indexed successfully",
    }


def save_and_ingest_pdf(file_bytes: bytes, original_filename: str) -> Dict[str, Any]:
    saved = save_uploaded_pdf(file_bytes, original_filename)
    indexed = ingest_pdf(
        file_path=saved["file_path"],
        document_id=saved["document_id"],
        filename=saved["filename"],
    )
    return {**saved, **indexed}


def retrieve_pdf_context(query: str, document_id: str, k: int = 8) -> Dict[str, Any]:
    """
    Retrieve the most relevant chunks from one uploaded PDF.
    """
    vector_store = get_vector_store()
    retriever = vector_store.as_retriever(
        search_kwargs={
            "k": k,
            "filter": {"document_id": document_id},
        }
    )

    docs = retriever.invoke(query)
    context_blocks: List[str] = []
    sources: List[Dict[str, Any]] = []

    for index, doc in enumerate(docs, start=1):
        page = doc.metadata.get("page", "unknown")
        filename = doc.metadata.get("filename", "uploaded file")
        source_label = f"Source {index}"

        context_blocks.append(
            f"""[{source_label}]
            File: {filename}
            Page: {page}
            Content:
            {doc.page_content}
            """
        )
        sources.append(
            {
                "source_number": index,
                "filename": filename,
                "page": page,
                "preview": doc.page_content[:250],
            }
        )

    return {
        "context": "\n\n".join(context_blocks).strip(),
        "sources": sources,
    }


@tool
def pdf_retriever_tool(query: str, document_id: str) -> str:
    """
    Search an uploaded PDF by document id and return relevant source-grounded content.
    """
    result = retrieve_pdf_context(query=query, document_id=document_id)
    return result["context"] or "No relevant PDF context found for this query."
