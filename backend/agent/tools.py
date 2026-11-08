"""The tools the AI agent is allowed to use.

Every tool receives the logged-in user from Django, NOT from the AI.
The AI can only choose a tool and give an id or a name. Each tool then
checks access with visible_patients(), the same rule the normal API uses.
"""
from django.db.models import Q

from audit.utils import log_action
from documents.models import Document
from patients.access import visible_patients

NO_ACCESS = {"error": "Not found, or you do not have access to this record."}


def to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def search_patients(user, args):
    query = str(args.get("query", "")).strip()
    if not query:
        return {"error": "Please give a name to search for."}

    patients = visible_patients(user)
    for word in query.split():  # "asha rao" must match both words
        patients = patients.filter(Q(first_name__icontains=word) | Q(last_name__icontains=word))

    return [
        {"id": p.id, "name": f"{p.first_name} {p.last_name}",
         "date_of_birth": str(p.date_of_birth), "gender": p.gender}
        for p in patients[:10]
    ]


def get_patient(user, args):
    patient_id = to_int(args.get("patient_id"))
    patient = visible_patients(user).filter(id=patient_id).first()
    if patient is None:
        return NO_ACCESS

    log_action(user, "agent_get_patient", "patient", patient.id)
    return {
        "id": patient.id,
        "name": f"{patient.first_name} {patient.last_name}",
        "date_of_birth": str(patient.date_of_birth),
        "gender": patient.gender,
        "phone": patient.phone,
        "email": patient.email,
        "address": patient.address,
        "assigned_doctor": patient.assigned_doctor.username if patient.assigned_doctor else None,
        "documents": [
            {"id": d.id, "name": d.name, "type": d.document_type,
             "status": d.status, "uploaded_at": d.uploaded_at.strftime("%Y-%m-%d")}
            for d in patient.documents.all()
        ],
    }


def get_document_details(user, args):
    document_id = to_int(args.get("document_id"))
    document = Document.objects.filter(
        id=document_id, patient__in=visible_patients(user),
    ).first()
    if document is None:
        return NO_ACCESS

    log_action(user, "agent_get_document", "document", document.id)
    if document.status != Document.COMPLETED:
        return {"error": f"This document is {document.status}, so there is no AI information yet."}

    return {
        "id": document.id,
        "name": document.name,
        "patient_id": document.patient_id,
        "document_type": document.document_type,
        "summary": document.ai_result["summary"],
        "test_results": document.ai_result["test_results"],
        "note": "AI-generated, needs human review.",
    }


TOOLS = {
    "search_patients": search_patients,
    "get_patient": get_patient,
    "get_document_details": get_document_details,
}

# What we tell the AI about each tool
TOOL_DECLARATIONS = [
    {
        "name": "search_patients",
        "description": "Find patients the current user can access, by first or last name. "
                       "Returns id, name, date of birth and gender. Use this first to get a patient id.",
        "parameters": {
            "type": "OBJECT",
            "properties": {"query": {"type": "STRING", "description": "Part of the patient's name"}},
            "required": ["query"],
        },
    },
    {
        "name": "get_patient",
        "description": "Get one patient's details and the list of their uploaded documents "
                       "(with document ids and processing status).",
        "parameters": {
            "type": "OBJECT",
            "properties": {"patient_id": {"type": "INTEGER", "description": "The patient's id"}},
            "required": ["patient_id"],
        },
    },
    {
        "name": "get_document_details",
        "description": "Get the AI summary and extracted test results of one completed document.",
        "parameters": {
            "type": "OBJECT",
            "properties": {"document_id": {"type": "INTEGER", "description": "The document's id"}},
            "required": ["document_id"],
        },
    },
]


def run_tool(user, name, args):
    """Runs one tool for this user. Unknown tools are refused."""
    tool = TOOLS.get(name)
    if tool is None:
        return {"error": "Unknown tool."}
    return tool(user, dict(args or {}))
