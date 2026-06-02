import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv

from agent.agente import agente, checkpointer

load_dotenv()

app = FastAPI(title="Asistente de Soporte - Fullstack", version="1.0.0")

ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_TOKEN = os.getenv("DEMO_TOKEN", "demo-token-12345")
security = HTTPBearer()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if creds.credentials != DEMO_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {"user": "demo"}


class LoginRequest(BaseModel):
    email: str
    password: str


class ChatInput(BaseModel):
    message: str
    session_id: str


@app.post("/auth/login")
def login(request: LoginRequest):
    if request.password != DEMO_TOKEN:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {"token": DEMO_TOKEN, "email": request.email}


@app.post("/api/chat")
def chat(body: ChatInput, user=Depends(get_current_user)):
    config = {"configurable": {"thread_id": body.session_id}}
    resultado = agente.invoke(
        {"mensajes": [HumanMessage(content=body.message)]},
        config=config,
    )
    return {"response": resultado["mensajes"][-1].content}


@app.post("/api/chat/stream")
async def chat_stream(body: ChatInput, user=Depends(get_current_user)):
    config = {"configurable": {"thread_id": body.session_id}}

    async def generar():
        try:
            async for event in agente.astream_events(
                {"mensajes": [HumanMessage(content=body.message)]},
                config=config,
                version="v2",
            ):
                if event["event"] == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    content = chunk.content
                    if isinstance(content, str) and content:
                        safe = content.replace("\n", "\\n")
                        yield f"data: {safe}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        generar(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/chat/history/{session_id}")
def historial(session_id: str, user=Depends(get_current_user)):
    config = {"configurable": {"thread_id": session_id}}
    state = checkpointer.get(config)
    if state is None:
        return {"session_id": session_id, "messages": []}

    mensajes = state["channel_values"].get("mensajes", [])
    historial_formateado = []
    for m in mensajes:
        if isinstance(m, HumanMessage):
            historial_formateado.append({"role": "user", "content": m.content})
        elif isinstance(m, AIMessage) and m.content:
            historial_formateado.append({"role": "assistant", "content": m.content})

    return {"session_id": session_id, "messages": historial_formateado}


@app.get("/health")
def health():
    return {"status": "ok"}
