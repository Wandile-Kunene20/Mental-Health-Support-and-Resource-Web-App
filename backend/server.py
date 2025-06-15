from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import uuid
from datetime import datetime, timezone
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Mental Health Resource API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URL)
db = client.mental_health_app

# OpenAI API Key
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class MoodEntry(BaseModel):
    mood_level: int  # 1-10 scale
    notes: Optional[str] = ""
    activities: Optional[List[str]] = []

class MoodResponse(BaseModel):
    id: str
    mood_level: int
    notes: str
    activities: List[str]
    timestamp: datetime

class Resource(BaseModel):
    title: str
    category: str
    description: str
    content: str
    url: Optional[str] = ""

class ResourceResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    content: str
    url: str
    timestamp: datetime

# Mental Health System Prompt
MENTAL_HEALTH_SYSTEM_PROMPT = """You are MindWell, a compassionate and knowledgeable mental health support companion. Your role is to:

1. Provide empathetic, non-judgmental emotional support
2. Offer evidence-based coping strategies and techniques
3. Share helpful mental health resources and information
4. Guide users toward appropriate professional help when needed
5. Encourage positive mental health practices

Important guidelines:
- Always be warm, understanding, and supportive
- Never provide medical diagnosis or replace professional therapy
- If someone expresses thoughts of self-harm, gently encourage them to seek immediate professional help
- Focus on practical coping strategies, mindfulness, and emotional validation
- Ask follow-up questions to better understand their situation
- Suggest specific techniques like deep breathing, grounding exercises, or journaling when appropriate

Remember: You're here to support, listen, and guide - not to diagnose or provide medical treatment."""

# Initialize sample resources
def init_sample_resources():
    sample_resources = [
        {
            "id": str(uuid.uuid4()),
            "title": "Understanding Anxiety: A Beginner's Guide",
            "category": "anxiety",
            "description": "Learn the basics of anxiety disorders and how they affect daily life.",
            "content": "Anxiety is a normal human emotion that everyone experiences from time to time. However, when anxiety becomes persistent, excessive, and interferes with daily activities, it may be classified as an anxiety disorder. Common symptoms include excessive worry, restlessness, fatigue, difficulty concentrating, irritability, muscle tension, and sleep disturbances. Understanding these symptoms is the first step toward managing anxiety effectively.",
            "url": "",
            "timestamp": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "5-4-3-2-1 Grounding Technique",
            "category": "coping-strategies",
            "description": "A simple grounding exercise to help manage anxiety and panic.",
            "content": "The 5-4-3-2-1 technique is a grounding exercise that uses your five senses to help you focus on the present moment: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This technique helps interrupt anxious thoughts and brings your attention back to the here and now.",
            "url": "",
            "timestamp": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Building a Daily Mindfulness Practice",
            "category": "mindfulness",
            "description": "Simple steps to incorporate mindfulness into your daily routine.",
            "content": "Mindfulness is the practice of paying attention to the present moment without judgment. Start with just 5 minutes a day: find a quiet space, focus on your breath, and when your mind wanders, gently bring attention back to breathing. You can also practice mindful walking, eating, or listening. Consistency is more important than duration.",
            "url": "",
            "timestamp": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "When to Seek Professional Help",
            "category": "professional-help",
            "description": "Signs that indicate it's time to consult a mental health professional.",
            "content": "Consider seeking professional help if you experience: persistent sadness or anxiety lasting more than 2 weeks, difficulty functioning at work or in relationships, thoughts of self-harm, substance abuse as a coping mechanism, sleep disturbances, or significant changes in appetite. Remember, seeking help is a sign of strength, not weakness.",
            "url": "",
            "timestamp": datetime.now(timezone.utc)
        }
    ]
    
    # Check if resources already exist
    if db.resources.count_documents({}) == 0:
        db.resources.insert_many(sample_resources)

# API Routes
@app.on_event("startup")
async def startup_event():
    init_sample_resources()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Mental Health Resource API"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(chat_request: ChatMessage):
    try:
        # Generate session ID if not provided
        session_id = chat_request.session_id or str(uuid.uuid4())
        
        # Initialize LLM chat
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=session_id,
            system_message=MENTAL_HEALTH_SYSTEM_PROMPT
        ).with_model("openai", "gpt-4o").with_max_tokens(1000)
        
        # Create user message
        user_message = UserMessage(text=chat_request.message)
        
        # Get AI response
        ai_response = await chat.send_message(user_message)
        
        # Store conversation in database
        conversation_entry = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_message": chat_request.message,
            "ai_response": ai_response,
            "timestamp": datetime.now(timezone.utc)
        }
        db.conversations.insert_one(conversation_entry)
        
        return ChatResponse(response=ai_response, session_id=session_id)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.get("/api/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    try:
        conversations = list(db.conversations.find(
            {"session_id": session_id},
            {"_id": 0}
        ).sort("timestamp", 1))
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {str(e)}")

@app.post("/api/mood", response_model=MoodResponse)
async def log_mood(mood_entry: MoodEntry):
    try:
        mood_data = {
            "id": str(uuid.uuid4()),
            "mood_level": mood_entry.mood_level,
            "notes": mood_entry.notes or "",
            "activities": mood_entry.activities or [],
            "timestamp": datetime.now(timezone.utc)
        }
        
        db.mood_entries.insert_one(mood_data)
        
        return MoodResponse(**mood_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging mood: {str(e)}")

@app.get("/api/mood/history")
async def get_mood_history(limit: int = 30):
    try:
        mood_entries = list(db.mood_entries.find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit))
        return {"mood_entries": mood_entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching mood history: {str(e)}")

@app.get("/api/resources")
async def get_resources(category: Optional[str] = None):
    try:
        query = {"category": category} if category else {}
        resources = list(db.resources.find(query, {"_id": 0}).sort("timestamp", -1))
        return {"resources": resources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching resources: {str(e)}")

@app.get("/api/resources/categories")
async def get_resource_categories():
    try:
        categories = db.resources.distinct("category")
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

@app.post("/api/resources", response_model=ResourceResponse)
async def create_resource(resource: Resource):
    try:
        resource_data = {
            "id": str(uuid.uuid4()),
            "title": resource.title,
            "category": resource.category,
            "description": resource.description,
            "content": resource.content,
            "url": resource.url or "",
            "timestamp": datetime.now(timezone.utc)
        }
        
        db.resources.insert_one(resource_data)
        
        return ResourceResponse(**resource_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating resource: {str(e)}")

@app.get("/api/crisis-resources")
async def get_crisis_resources():
    return {
        "emergency_contacts": [
            {
                "name": "National Suicide Prevention Lifeline",
                "phone": "988",
                "description": "24/7 free and confidential support"
            },
            {
                "name": "Crisis Text Line",
                "phone": "Text HOME to 741741",
                "description": "24/7 crisis support via text"
            },
            {
                "name": "SAMHSA National Helpline",
                "phone": "1-800-662-4357",
                "description": "Treatment referral and information service"
            }
        ],
        "immediate_steps": [
            "If you're having thoughts of self-harm, please reach out for help immediately",
            "Contact emergency services (911) if in immediate danger",
            "Reach out to a trusted friend, family member, or counselor",
            "Use grounding techniques to help manage overwhelming feelings",
            "Remember: You are not alone, and help is available"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)