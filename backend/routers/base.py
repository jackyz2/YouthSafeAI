import asyncio
import base64
import json
import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Security, status, WebSocket, Body
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from settings import app_settings
from starlette.requests import Request

import jwt

from app.services.email import send_email_notification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



# from db_utils.aws_rds import RDSClient
from db_utils.supabase_rds import RDSClient
RDS_CLIENT = RDSClient()
# test write
# RDS_CLIENT.write_log("server_init_session_id", "server_init_type", {"server_init_log_body": ""}, "user_email_address")

DUMMY_USER_ID = 1

baseRouter = APIRouter()

class LogData(BaseModel):
    type: str
    user: str
    log_body: str

class AlertData(BaseModel):
    user: str
    alert_type: str
    alert_details: str  # JSON string containing all conversation details

class ConversationData(BaseModel):
    user: str
    conversation_id: Optional[int] = None
    chatbot_id: Optional[int] = None
    child_user_id: Optional[int] = 1
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    conversation_topic: Optional[str] = None
    conversation_summary: Optional[str] = None
    messages: Optional[str] = None
    platform: Optional[str] = "unknown"

class MessageData(BaseModel):
    message_id: Optional[int] = None
    conversation_id: int
    sender: str
    message_text: str
    timestamp: Optional[str] = None
    sender_type: Optional[str] = "unknown"
    user: Optional[str] = None  # Optional field for tracking who sent the message

class UsageData(BaseModel):
    user: str
    session_id: str
    usage_details: dict

class EmailNotificationData(BaseModel):
    email: str
    child_name: str
    risk_level: str
    redirect_url: str

class AddChildData(BaseModel):
    parent_user_id: str
    child_name: str
    child_age: int
class RemoveChildData(BaseModel):
    parent_user_id: str
    child_user_id: str

class RenameChildData(BaseModel):
    child_user_id: str
    new_name: str

# Add new models
class IDGenerationRequest(BaseModel):
    userId: str
    childUserId: int
    platform: str

class IDGenerationResponse(BaseModel):
    conversationId: int
    riskEventId: int
    chatbotId: int
    messageId: int

class ChatbotData(BaseModel):
    chatbot_id: int
    name: str
    metadata: dict = {}
    chatbotPlatform: str

def get_session_id(request: Request) -> str:
    request.session["session_id"] = request.session.get("session_id")
    session_id = request.session["session_id"]

    if session_id is None:
        session_id = str(uuid.uuid4())  # Or your own method of generating a unique session ID
        request.session["session_id"] = session_id
    return session_id


# Add these constants for JWT configuration
JWT_SECRET = app_settings.jwt_secret
JWT_ALGORITHM = "HS256"
security = HTTPBearer()

def decrypt_data(encrypted_data, key):
    if not encrypted_data.strip():
        return encrypted_data.strip()
    encrypted_data_bytes = base64.b64decode(encrypted_data)
    key_bytes = key.encode('utf-8')
    backend = default_backend()
    cipher = Cipher(algorithms.AES(key_bytes), modes.ECB(), backend=backend)
    decryptor = cipher.decryptor()
    decrypted_padded_data = decryptor.update(encrypted_data_bytes) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    decrypted_data = unpadder.update(decrypted_padded_data) + unpadder.finalize()
    return decrypted_data.decode()

def decode_jwt(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], audience="authenticated")
        return decoded_token
    except jwt.ExpiredSignatureError:
        return None  # Token has expired
    except jwt.InvalidTokenError:
        return None  # Invalid token

def get_current_user(token, request: Request):
    decoded_token = decode_jwt(token)
    if not decoded_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    return decoded_token

def auth_middleware(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    return get_current_user(token, request)

@baseRouter.get("/")
def root_api_v1(request: Request):
    get_session_id(request)
    return {"message": "Hello World from api/v1"}

@baseRouter.post("/ids/generate", response_model=IDGenerationResponse)
async def generate_ids(data: IDGenerationRequest, request: Request):
    try:
        # 1. Verify child user ID exists
        child_user = await RDS_CLIENT.verify_child_user(data.childUserId)
        if not child_user:
            raise HTTPException(
                status_code=404,
                detail=f"Child user with ID {data.childUserId} not found"
            )

        # 2. Get or create chatbot ID
        chatbot_id = await RDS_CLIENT.generate_chatbot_id(
            platform=data.platform
        )

        # 3. Generate new conversation ID
        conversation_id = await RDS_CLIENT.generate_conversation_id(
            child_user_id=data.childUserId
        )

        # 4. Generate new risk event ID
        risk_event_id = await RDS_CLIENT.generate_risk_event_id(
            child_user_id=data.childUserId
        )

        # 5. Generate new message ID
        message_id = await RDS_CLIENT.generate_message_id(
            child_user_id=data.childUserId
        )

        return {
            "conversationId": conversation_id,
            "riskEventId": risk_event_id,
            "childUserId": data.childUserId,
            "chatbotId": chatbot_id,
            "messageId": message_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating IDs: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating IDs: {str(e)}"
        )
    

# endpoints for logging (json data: {type: str, log_body: dict}})
@baseRouter.post("/log/save")
async def log_data(logData: LogData, request: Request):
    sid = get_session_id(request)
    log_type, log_body, user = logData.type, logData.log_body, logData.user

    # load log_body from json string
    log_body = json.loads(log_body)

    RDS_CLIENT.write_log(sid, log_type, log_body, user)

@baseRouter.get("/log/check_session_id")
async def check_session_id(request: Request):
    return {"session_id": get_session_id(request)}

@baseRouter.post("/alerts/receive")
async def receive_alert(alertData: AlertData, request: Request):
    try:
        # Parse the alert_details JSON string
        alert_details = json.loads(alertData.alert_details)
        
        # Log the incoming data for debugging
        logger.info(f"Received alert data: {alert_details}")
        
        # Write to risk_events_log table
        risk_event = RDS_CLIENT.write_alert(alert_details)
        
        return {
            "message": "Alert received and risk event saved successfully",
            "risk_event_id": risk_event.get('risk_event_id') if risk_event else None
        }
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON in alert_details: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error processing alert: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing alert: {str(e)}"
        )

@baseRouter.post("/conversations/receive")
async def receive_conversation(request: Request):
    try:
        # Get raw data from request
        raw_data = await request.json()
        logger.info(f"Raw input data: {raw_data}")

        # Check if data is already in the expected format
        if 'user' in raw_data and 'conversation_details' in raw_data:
            conversation_data = raw_data
        else:
            # If not, construct the expected format
            conversation_data = {
                'user': raw_data.get('user', 'unknown'),
                'conversation_details': {
                    'conversation_id': raw_data.get('conversation_id'),
                    'child_user_id': raw_data.get('child_user_id', 1),  # Default to 1 if not provided
                    'chatbot_id': raw_data.get('chatbot_id'),
                    'start_time': raw_data.get('start_time'),
                    'end_time': raw_data.get('end_time'),
                    'conversation_topic': raw_data.get('conversation_topic'),
                    'conversation_summary': raw_data.get('conversation_summary'),
                    'messages': raw_data.get('messages'),
                    'platform': raw_data.get('platform', 'unknown')
                }
            }

        # Write to conversations table
        conversation = RDS_CLIENT.write_conversation(conversation_data['conversation_details'])
        
        return {
            "message": "Conversation received and saved successfully",
            "conversation_id": conversation.get('conversation_id') if conversation else None
        }
    except Exception as e:
        logger.error(f"Error processing conversation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing conversation: {str(e)}"
        )

@baseRouter.post("/messages/receive")
async def receive_message(messageData: MessageData, request: Request):
    try:
        # Prepare message details
        message_details = {
            'message_id': messageData.message_id,
            'conversation_id': messageData.conversation_id,
            'sender': messageData.sender,
            'message_text': messageData.message_text,
            'timestamp': messageData.timestamp or datetime.now().isoformat(),
            'sender_type': messageData.sender_type
        }

        logger.info(f"Received message data: {message_details}")
        message = RDS_CLIENT.write_message(message_details)
        
        return {    
            "ok": True,
            "message": "Message received successfully",
            "message_id": message.get('message_id') if message else None
        }
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return {
            "ok": False,
            "error": str(e),
            "message": "Error processing message"
        }

@baseRouter.post("/usage/receive")
async def receive_usage(usageData: UsageData, request: Request):
    # Process the usage data
    usage_details = json.loads(usageData.usage_details)
    # RDS_CLIENT.write_log(usageData.session_id, "usage", usage_details, usageData.user)
    return {"message": "Usage data received successfully"}


# endpoints for parental control admin dashboard DB reads
@baseRouter.get("/parental_control/get_all_conversations")
async def get_all_conversations(request: Request):
    return RDS_CLIENT.read_all_conversations(DUMMY_USER_ID)

@baseRouter.get("/parental_control/get_all_convo")
async def get_all_convo(request: Request):
    return RDS_CLIENT.get_all_conversations(DUMMY_USER_ID)

@baseRouter.get("/parental_control/get_risky_event_by_id/{riskyEvent_id}")
async def get_risky_event_by_id(riskyEvent_id: int):
    return RDS_CLIENT.get_risky_event_by_id(riskyEvent_id)

# endpoints for parental control admin dashboard DB reads
@baseRouter.get("/parental_control/get_conversation_times")
async def get_conversation_times(request: Request):
    return RDS_CLIENT.get_conversation_times(DUMMY_USER_ID)

# endpoints for family management
@baseRouter.get("/family/get_all_children")
async def get_all_children(request: Request):
    return RDS_CLIENT.get_all_children(DUMMY_USER_ID)
@baseRouter.post("/family/add_child")
async def add_child(data: AddChildData, request: Request):
    return RDS_CLIENT.add_child(data.parent_user_id, data.child_name, data.child_age)
@baseRouter.post("/family/remove_child")
async def remove_child(data: RemoveChildData, request: Request):
    return RDS_CLIENT.remove_child(data.parent_user_id, data.child_user_id)
@baseRouter.post("/family/rename_child")
async def rename_child(data: RenameChildData, request: Request):
    return RDS_CLIENT.rename_child(data.child_user_id, data.new_name)


@baseRouter.post("/notify/email")
async def send_email_notification_endpoint(data: EmailNotificationData, request: Request):
    try:
        subject = f"AI Chat Risk Notification for {data.child_name}"
        body = f"Dear Parent,\n\nWe have detected a {data.risk_level} risk level in your child's AI chat activities. \n\nPlease click the following link to view the conversation: {data.redirect_url}\n\nBest regards,\YouthSafeAgent Team"
        
        send_email_notification(data.email, subject, body)
        
        return {"message": "Email notification sent successfully"}
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error sending email: {str(e)}"
        )


@baseRouter.get("/testing/email_send")
async def testing_email_send(request: Request):
    await send_email_notification_endpoint(EmailNotificationData(
        email="yirenl2@illinois.edu",   
        child_name="Test Child",
        risk_level="High",
        redirect_url="http://localhost:3000/#"
    ), request)
    return {"message": "Email sent successfully"}

@baseRouter.post("/chatbots/receive")
async def receive_chatbot(chatbotData: ChatbotData, request: Request):
    try:
        # Log the incoming data
        logger.info(f"Received chatbot data: {chatbotData}")

        # Prepare chatbot data for insertion
        chatbot_data = {
            "chatbot_id": chatbotData.chatbot_id,
            "name": chatbotData.name,
            "metadata": json.dumps(chatbotData.metadata),  # Convert dict to JSON string
            "chatbotPlatform": chatbotData.chatbotPlatform
        }

        # Write to chatbots table
        response = RDS_CLIENT.write_chatbot(chatbot_data)
        
        return Response(
            content=json.dumps({
                "ok": True,
                "message": "Chatbot received and saved successfully",
                "chatbot_id": response.get('chatbot_id') if response else None
            }),
            media_type="application/json",
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error processing chatbot: {str(e)}")
        return Response(
            content=json.dumps({
                "ok": False,
                "error": str(e),
                "message": "Error processing chatbot"
            }),
            media_type="application/json",
            status_code=500
        )


