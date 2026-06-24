import time
from typing import Any, Dict, List, Literal, Optional

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from ..agents import critic_chain, llm
from ..pipeline import run_pipeline
from .rag_service import retrieve_pdf_context

ReportMode = Literal["web", "pdf", "hybrid"]


report_writer_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are the Report Writer Agent in a multi-agent research system.
Write professional, structured reports with clear headings, concise analysis,
and source-aware citations.

Critical grounding rules:
- In PDF RAG mode, use only the provided PDF context.
- If the answer is not present in the PDF context, say the PDF does not contain enough information.
- Do not invent facts, citations, page numbers, URLs, or claims.
- In hybrid mode, clearly distinguish PDF-supported findings from web-supported findings.
- Cite PDF evidence as [Source N, filename, page X] when source metadata is provided.""",
        ),
        (
            "human",
            """Mode: {mode}

User query:
{query}

Query Planner Agent output:
{plan}

PDF Retriever Agent context:
{pdf_context}

Web Search Agent research:
{web_context}

Analyzer Agent notes:
{analysis}

Write the final report with:
- Executive Summary
- Key Findings
- Detailed Analysis
- Evidence and Citations
- Limitations
- Conclusion""",
        ),
    ]
)

report_writer_chain = report_writer_prompt | llm | StrOutputParser()


def _query_planner_agent(query: str, mode: ReportMode, document_id: Optional[str]) -> str:
    needs_pdf = mode in {"pdf", "hybrid"}
    needs_web = mode in {"web", "hybrid"}

    return (
        f"Research mode: {mode}. "
        f"Use PDF retrieval: {'yes' if needs_pdf else 'no'}. "
        f"Use web search pipeline: {'yes' if needs_web else 'no'}. "
        f"Document id: {document_id or 'not provided'}. "
        "Produce a grounded report and avoid unsupported claims."
    )


def _pdf_retriever_agent(query: str, document_id: str) -> Dict[str, Any]:
    return retrieve_pdf_context(query=query, document_id=document_id)


def _web_search_agent(query: str) -> Dict[str, Any]:
    return run_pipeline(query)


def _analyzer_agent(
    mode: ReportMode,
    pdf_context: str,
    web_state: Optional[Dict[str, Any]],
) -> str:
    notes: List[str] = [f"Mode selected: {mode}."]

    if mode in {"pdf", "hybrid"}:
        if pdf_context:
            notes.append("PDF context was retrieved and should be treated as primary document evidence.")
        else:
            notes.append("No relevant PDF context was retrieved; report must state the PDF is insufficient.")

    if web_state:
        notes.append("Web pipeline returned search, scraped content, report, and critique artifacts.")

    return " ".join(notes)


def _citation_checker_agent(report: str, sources: List[Dict[str, Any]], mode: ReportMode) -> str:
    if mode == "web":
        return report

    if not sources:
        return (
            f"{report}\n\n"
            "## Citation Check\n"
            "No PDF sources were retrieved. Any PDF-specific answer should be treated as insufficient."
        )

    cited_sources = "\n".join(
        f"- Source {source['source_number']}: {source['filename']}, page {source['page']}"
        for source in sources
    )
    return f"{report}\n\n## Retrieved PDF Sources\n{cited_sources}"


def _write_grounded_report(
    query: str,
    mode: ReportMode,
    plan: str,
    pdf_context: str = "",
    web_context: str = "",
    analysis: str = "",
) -> str:
    if mode == "pdf" and not pdf_context.strip():
        return (
            "# PDF RAG Report\n\n"
            "The uploaded PDF does not contain enough relevant information to answer this query. "
            "Please upload a more relevant document or use Hybrid/Web Research mode."
        )

    return report_writer_chain.invoke(
        {
            "mode": mode,
            "query": query,
            "plan": plan,
            "pdf_context": pdf_context or "No PDF context provided.",
            "web_context": web_context or "No web context provided.",
            "analysis": analysis or "No additional analysis notes.",
        }
    )


def generate_report_from_web(query: str) -> Dict[str, Any]:
    web_state = _web_search_agent(query)
    return {
        "report": web_state.get("report"),
        "feedback": web_state.get("feedback"),
        "sources": [],
        "metadata": {
            "has_search_results": bool(web_state.get("search_results")),
            "has_scraped_content": bool(web_state.get("scraped_content")),
        },
    }


def generate_report_from_pdf(query: str, document_id: str) -> Dict[str, Any]:
    plan = _query_planner_agent(query, "pdf", document_id)
    rag_result = _pdf_retriever_agent(query, document_id)
    pdf_context = rag_result["context"]
    sources = rag_result["sources"]
    analysis = _analyzer_agent("pdf", pdf_context, None)

    report = _write_grounded_report(
        query=query,
        mode="pdf",
        plan=plan,
        pdf_context=pdf_context,
        analysis=analysis,
    )
    checked_report = _citation_checker_agent(report, sources, "pdf")
    feedback = critic_chain.invoke({"report": checked_report})

    return {
        "report": checked_report,
        "feedback": feedback,
        "sources": sources,
        "metadata": {
            "document_id": document_id,
            "retrieved_chunks": len(sources),
        },
    }


def generate_report_from_hybrid(query: str, document_id: str) -> Dict[str, Any]:
    plan = _query_planner_agent(query, "hybrid", document_id)
    rag_result = _pdf_retriever_agent(query, document_id)
    web_state = _web_search_agent(query)

    pdf_context = rag_result["context"]
    sources = rag_result["sources"]
    web_report = str(web_state.get("report", ""))
    web_feedback = str(web_state.get("feedback", ""))
    web_context = (
        f"Web report:\n{web_report}\n\n"
        f"Web critique feedback:\n{web_feedback}"
    )
    analysis = _analyzer_agent("hybrid", pdf_context, web_state)

    report = _write_grounded_report(
        query=query,
        mode="hybrid",
        plan=plan,
        pdf_context=pdf_context,
        web_context=web_context,
        analysis=analysis,
    )
    checked_report = _citation_checker_agent(report, sources, "hybrid")
    feedback = critic_chain.invoke({"report": checked_report})

    return {
        "report": checked_report,
        "feedback": feedback,
        "sources": sources,
        "metadata": {
            "document_id": document_id,
            "retrieved_chunks": len(sources),
            "has_web_report": bool(web_report),
        },
    }


def generate_report_router(
    query: str,
    mode: ReportMode = "web",
    document_id: Optional[str] = None,
) -> Dict[str, Any]:
    start_time = time.perf_counter()
    clean_query = query.strip()

    if mode in {"pdf", "hybrid"} and not document_id:
        raise ValueError("document_id is required for PDF RAG and Hybrid modes.")

    if mode == "pdf":
        result = generate_report_from_pdf(clean_query, document_id=document_id or "")
    elif mode == "hybrid":
        result = generate_report_from_hybrid(clean_query, document_id=document_id or "")
    elif mode == "web":
        result = generate_report_from_web(clean_query)
    else:
        raise ValueError(f"Unsupported report mode: {mode}")

    result["metadata"] = {
        **result.get("metadata", {}),
        "mode": mode,
        "elapsed_seconds": round(time.perf_counter() - start_time, 2),
    }
    return result
