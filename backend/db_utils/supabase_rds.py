import abc

import os
import time
from datetime import datetime

import json

from supabase import create_client, Client
import platform


from settings import app_settings

supabase_url: str = app_settings.supabase_url
supabase_service_key: str = app_settings.supabase_service_key


class Singleton(abc.ABCMeta, type):
    """
    Singleton metaclass for ensuring only one instance of a class.
    """

    _instances = {}

    def __call__(cls, *args, **kwargs):
        """Call method for the singleton metaclass."""
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class AbstractSingleton(abc.ABC, metaclass=Singleton):
    """
    Abstract singleton class for ensuring only one instance of a class.
    """

    pass


class RDSClient(metaclass=Singleton):
    """
    Supabase Client.
    """

    def __init__(self) -> None:
        print("Initializing Supabase Client...")
        start = time.time()

        self.client: Client = create_client(supabase_url, supabase_service_key)

        end = time.time()
        print(f"Supabase Client initialized in {end - start} seconds.")

    # def write_log(self, session_id: str, type: str, log_body: dict, user: str):
    #     data = {
    #         "user": user,
    #         "session_id": session_id,
    #         "type": type,
    #         "log_body": json.dumps(log_body),
    #         "client_name": platform.node(),
    #     }
    #     try:
    #         response = self.client.table("coquest_block_dev").insert(data).execute()
    #         # if response.error:
    #         #     raise Exception(response.error)
    #     except Exception as e:
    #         print("Error when writing log to database: " + str(e))
    #     return data


    async def verify_child_user(self, child_user_id: int) -> bool:
        """Verify that a child user exists"""
        try:
            response = self.client.from_("users").select("user_id").eq("user_id", child_user_id).eq("role", "child").execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error verifying child user: {str(e)}")
            raise Exception(f"Error verifying child user: {str(e)}")

    async def generate_chatbot_id(self, platform: str) -> int:
        """Generate new chatbot ID"""
        try:
            response = self.client.from_("chatbots").select("chatbot_id").execute()
            existing_ids = [r['chatbot_id'] for r in response.data]
            next_id = max(existing_ids, default=0) + 1
            return next_id
        except Exception as e:
            print(f"Error generating chatbot ID: {str(e)}")
            raise Exception(f"Error generating chatbot ID: {str(e)}")

    async def generate_conversation_id(self, child_user_id: int) -> int:
        """Calculate next conversation ID based on existing conversations"""
        try:
            response = self.client.from_("conversations").select("conversation_id").execute()
            existing_ids = [r['conversation_id'] for r in response.data]
            next_id = max(existing_ids, default=0) + 1
            return next_id
        except Exception as e:
            print(f"Error generating conversation ID: {str(e)}")
            raise Exception(f"Error generating conversation ID: {str(e)}")

    async def generate_risk_event_id(self, child_user_id: int) -> int:
        """Calculate next risk event ID based on all existing risk events"""
        try:
            response = self.client.from_("risky_events_log").select("risky_event_id").execute()
            existing_ids = [r['risky_event_id'] for r in response.data]
            next_id = max(existing_ids, default=0) + 1
            return next_id
        except Exception as e:
            print(f"Error generating risk event ID: {str(e)}")
            raise Exception(f"Error generating risk event ID: {str(e)}")

    async def generate_message_id(self, child_user_id: int) -> int:
        """Calculate next message ID based on existing messages"""
        try:
            response = self.client.from_("messages").select("message_id").execute()
            existing_ids = [r['message_id'] for r in response.data]
            next_id = max(existing_ids, default=0) + 1
            return next_id
        except Exception as e:
            print(f"Error generating message ID: {str(e)}")
            raise Exception(f"Error generating message ID: {str(e)}")

    def create_user_settings(self, user_id: str, quota_limit: int = 50):
        """
        Create a new user settings in the database, table user_settings.
        """
        try:
            self.client.table("user_settings").insert({"user_id": user_id, "quota_limit": quota_limit, "last_updated": datetime.now().isoformat()}).execute()
            return True
        except Exception as e:
            raise Exception("Error when creating new user settings: " + str(e))

    def get_user_quota(self, user_id: str):
        """
        Get the user's quota from the database, table user_settings.
        If the user does not exist in the database, create a new user with default quota. 
        """
        try:
            # first check if the user exists in the database
            response = self.client.table("user_settings").select("*").eq("user_id", user_id).execute()
            if len(response.data) > 0:
                return response.data[0]["quota_limit"]
            else:
                # Create a new user with default quota
                self.create_user_settings(user_id, 50)
                return 50
        except Exception as e:
            raise Exception("Error when getting user quota: " + str(e))
        
    def get_conversation_times(self, user_id: str):
        """
        Get the start_time and end_time for each conversation associated with the user's child accounts.
        """
        try:
            # Step 1: Get child user IDs associated with the parent
            response = self.client.from_("parent_child_relations").select("child_user_id").eq("parent_user_id", user_id).execute()
            child_user_ids = [child["child_user_id"] for child in response.data]

            if not child_user_ids:
                return []  # No child users found, return empty list

            # Step 2: Fetch conversations for the child user IDs
            response = self.client.from_("conversations").select(
                "conversation_id, start_time, end_time"
            ).in_("child_user_id", child_user_ids).execute()
            conversations = response.data

            # Transform the result to a simple list of conversation times
            conversation_times = [
                {
                    "conversation_id": conversation["conversation_id"],
                    "start_time": conversation.get("start_time", "Unknown start time"),
                    "end_time": conversation.get("end_time", "Unknown end time"),
                }
                for conversation in conversations
            ]

            return conversation_times

        except Exception as e:
            raise Exception("Error when fetching conversation times: " + str(e))


    def update_user_quota(self, user_id: str, quota_limit: int):
        """
        Update the user's quota in the database, table user_settings.
        """
        try:    
            self.client.table("user_settings").update({"quota_limit": quota_limit, "last_updated": datetime.now().isoformat()}).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            raise Exception("Error when updating user quota: " + str(e))
    
    def get_all_user_email_newsletter_subscribed(self) -> list[dict]:
        try:
            response = self.client.from_("user_settings_with_email").select("user_id, email").eq("is_newsletter_subscribed", True).execute()
            return response.data
        except Exception as e:
            raise Exception("Error when getting user email newsletter subscription: " + str(e))
        
    def read_all_conversations(self, user_id: str):
        """
        Read all conversations with their associated risky events and transform them into the desired structure.
        """
        try:
            # Step 1: Get child user IDs associated with the parent
            response = self.client.from_("parent_child_relations").select("child_user_id").eq("parent_user_id", user_id).execute()
            child_user_ids = [child["child_user_id"] for child in response.data]

            if not child_user_ids:
                return []  # No child users found, return empty list

            response = self.client.from_("risky_events_log").select(
                "risky_event_id, timestamp, riskType, riskLevel, riskyReason, conversation_id, child_user_id"
            ).in_("child_user_id", child_user_ids).execute()
            risky_events = response.data

            # Filter risky events for conversations associated with the child user IDs
            risky_event_conversation_ids = [event["conversation_id"] for event in risky_events]

            # Step 3: Fetch conversations matching the risky event conversation IDs
            response = self.client.from_("conversations").select(
                "conversation_id, chatbot_id, child_user_id, start_time, end_time, conversationTopic, conversationSummary, child_user_id"
            ).in_("conversation_id", risky_event_conversation_ids).in_("child_user_id", child_user_ids).execute()
            conversations = {conv["conversation_id"]: conv for conv in response.data}

            if not conversations:
                return []  # No matching conversations found, return empty list

            # Step 4: Get chatbot details for the chatbot IDs
            chatbot_ids = {conv["chatbot_id"] for conv in conversations.values()}
            response = self.client.from_("chatbots").select("chatbot_id, name, chatbotPlatform").in_("chatbot_id", list(chatbot_ids)).execute()
            chatbot_info = {chatbot["chatbot_id"]: chatbot for chatbot in response.data}

            # Step 5: Fetch usernames for all child_user_ids
            response = self.client.from_("users").select("user_id, username").in_("user_id", child_user_ids).execute()
            user_info = {user["user_id"]: user["username"] for user in response.data}

            # Step 6: Transform risky events into the required format
            enriched_conversations = []
            for event in risky_events:
                conversation_id = event["conversation_id"]
                conversation = conversations.get(conversation_id, {})
                chatbot = chatbot_info.get(conversation.get("chatbot_id"), {})
                if (event.get("riskType").lower() != "no risk"):
                    # Build the enriched conversation object
                    enriched_conversations.append({
                        "username": user_info.get(event.get("child_user_id"), "Unknown User"),
                        "riskyEvent_id": event.get("risky_event_id"),
                        "conversation_id": conversation_id,
                        "conversationTopics": conversation.get("conversationTopic", []),
                        "conversationSummarization": conversation.get("conversationSummary", "No summarization available"),
                        "riskType": event.get("riskType", "Unknown Risk"),
                        "riskLevel": event.get("riskLevel", "Unknown").capitalize(),
                        "riskyReason": event.get("riskyReason", "No reason provided"),
                        "timestamp": event.get("timestamp", "Unknown timestamp"),
                        "chatbotPlatform": chatbot.get("chatbotPlatform", "Unknown Platform"),
                        "chatbotDescription": chatbot.get("name", "Unknown Chatbot"),
                    })

            return enriched_conversations

        except Exception as e:
            raise Exception("Error when reading all conversations: " + str(e))


    def get_all_conversations(self, user_id: str):
        """
        Read all conversations and transform them into the desired structure.
        """
        try:
            # Step 1: Get child user IDs associated with the parent
            response = self.client.from_("parent_child_relations").select("child_user_id").eq("parent_user_id", user_id).execute()
            child_user_ids = [child["child_user_id"] for child in response.data]

            if not child_user_ids:
                return []  # No child users found, return empty list

            # Step 2: Get risky events for conversations linked to the child user IDs
            response = self.client.from_("conversations").select(
                "conversation_id, chatbot_id, child_user_id, start_time, end_time, conversationTopic, conversationSummary, child_user_id"
            ).in_("child_user_id", child_user_ids).execute()
            conversations = response.data

            if not conversations:
                return []  # No matching conversations found, return empty list

            # Step 4: Get chatbot details for the chatbot IDs
            chatbot_ids = {conv["chatbot_id"] for conv in conversations}
            response = self.client.from_("chatbots").select("chatbot_id, name, chatbotPlatform").in_("chatbot_id", list(chatbot_ids)).execute()
            chatbot_info = {chatbot["chatbot_id"]: chatbot for chatbot in response.data}

            # Step 5: Transform risky events into the required format
            enriched_conversations = []
            for conversation in conversations:
                chatbot = chatbot_info.get(conversation.get("chatbot_id"), {})
                # Build the enriched conversation object
                enriched_conversations.append({
                    "conversation_id": conversation.get("conversation_id"),
                    "start_time": conversation.get("start_time"),
                    "end_time": conversation.get("end_time"),
                    "conversationTopics": conversation.get("conversationTopic", []),
                    "conversationSummarization": conversation.get("conversationSummary", "No summarization available"),
                    "chatbotPlatform": chatbot.get("chatbotPlatform", "Unknown Platform"),
                    "chatbotDescription": chatbot.get("name", "Unknown Chatbot"),
                    
                })

            return enriched_conversations

        except Exception as e:
            raise Exception("Error when reading all conversations: " + str(e))


    def get_risky_event_by_id(self, riskyEvent_id: int):
        try:
            # Step 1: Get the specific risky event by riskyEvent_id
            response = self.client.from_("risky_events_log").select(
                "risky_event_id, timestamp, riskType, riskLevel, riskyReason, conversation_id"
            ).eq("risky_event_id", riskyEvent_id).execute()
            
            if not response.data:
                return None  # No risky event found with the given ID

            risky_event = response.data[0]

            # Step 2: Fetch the conversation associated with the risky event
            conversation_id = risky_event["conversation_id"]
            response = self.client.from_("conversations").select(
                "conversation_id, chatbot_id, child_user_id, start_time, end_time, conversationTopic, conversationSummary"
            ).eq("conversation_id", conversation_id).execute()

            if not response.data:
                return None  # No conversation found with the given ID

            conversation = response.data[0]

            # Step 3: Get the chatbot details associated with the conversation
            chatbot_id = conversation["chatbot_id"]
            response = self.client.from_("chatbots").select(
                "chatbot_id, name, chatbotPlatform"
            ).eq("chatbot_id", chatbot_id).execute()

            if not response.data:
                return None  # No chatbot found with the given ID

            chatbot = response.data[0]

            # Step 4: Build the enriched conversation object
            enriched_conversation = {
                "riskyEvent_id": risky_event.get("risky_event_id"),
                "conversation_id": conversation_id,
                "conversationTopics": conversation.get("conversationTopic", []),
                "conversationSummarization": conversation.get("conversationSummary", "No summarization available"),
                "riskType": risky_event.get("riskType", "Unknown Risk"),
                "riskLevel": risky_event.get("riskLevel", "Unknown"),
                "riskyReason": risky_event.get("riskyReason", "No reason provided"),
                "timestamp": risky_event.get("timestamp", "Unknown timestamp"),
                "chatbotPlatform": chatbot.get("chatbotPlatform", "Unknown Platform"),
                "chatbotDescription": chatbot.get("name", "Unknown Chatbot"),
            }

            return enriched_conversation

        except Exception as e:
            raise Exception("Error when reading the risky event: " + str(e))


    def write_conversation(self, conversation_details: dict):
        """
        Write conversation data to the conversations table
        Expected conversation_details structure:
        {
            'conversation_id': int,
            'child_user_id': int,
            'chatbot_id': int,
            'start_time': str,
            'end_time': str,
            'conversation_topic': str,
            'conversation_summary': str,
            # 'messages': List[dict],
            'platform': str
        }
        """
        try:
            # Prepare conversation data
            conversation_data = {
                "conversation_id": conversation_details.get('conversation_id'),
                "child_user_id": conversation_details.get('child_user_id'),
                "chatbot_id": conversation_details.get('chatbot_id'),
                "start_time": conversation_details.get('start_time'),
                "end_time": conversation_details.get('end_time'),
                "conversationTopic": conversation_details.get('conversation_topic', 'unknown'),
                "conversationSummary": conversation_details.get('conversation_summary', 'No summary available'),
                # Store messages as JSON string if needed
                # "messages": json.dumps(conversation_details.get('messages', [])) if conversation_details.get('messages') else None,
                "platform": conversation_details.get('platform', 'unknown')
            }

            response = self.client.table("conversations").insert(conversation_data).execute()
            
            if not response.data:
                raise Exception("No data returned from conversation insert")
            
            return response.data[0]
            
        except Exception as e:
            print(f"Error writing conversation to database: {str(e)}")
            raise Exception(f"Error writing conversation to database: {str(e)}")
    
    def write_alert(self, alert_details: dict):
        """
        Write alert data to the risky_events_log table
        Expected alert_details structure:
        {
            'risk_event_id': int,
            'conversation_id': int,
            'child_user_id': int,
            'riskLevel': str,
            'riskType': str,
            'riskyReason': str,
            'timestamp': str,
            'messages': List[dict]  # Recent chat messages
        }
        """
        try:
            # Prepare alert data
            alert_data = {
                "risky_event_id": alert_details.get('risk_event_id'),
                "conversation_id": alert_details.get('conversation_id'),
                "child_user_id": alert_details.get('child_user_id'),
                "riskLevel": alert_details.get('riskLevel'),
                "riskType": alert_details.get('riskType'),
                "riskyReason": alert_details.get('riskyReason'),
                "timestamp": alert_details.get('timestamp', datetime.now().isoformat()),
                "messages": json.dumps(alert_details.get('messages', [])) if alert_details.get('messages') else None
            }

            response = self.client.table("risky_events_log").insert(alert_data).execute()
            
            if not response.data:
                raise Exception("No data returned from alert insert")
            
            return response.data[0]
            
        except Exception as e:
            print(f"Error writing alert to database: {str(e)}")
            raise Exception(f"Error writing alert to database: {str(e)}")
        
    def write_message(self, message_details: dict):
        """
        Write message data to the messages table
        Expected message_details structure:
        {
            'message_id': int,
            'conversation_id': int,
            'sender': str,
            'message_text': str,
            'timestamp': str,
            'sender_type': str
        }
        """
        try:
            # Prepare message data
            message_data = {
                "message_id": message_details.get('message_id'),
                "conversation_id": message_details.get('conversation_id'),
                "sender": message_details.get('sender'),
                "message_text": message_details.get('message_text'),
                "timestamp": message_details.get('timestamp', datetime.now().isoformat()),
                "sender_type": message_details.get('sender_type', 'unknown')
            }

            response = self.client.table("messages").insert(message_data).execute()
            
            if not response.data:
                raise Exception("No data returned from message insert")
            
            return response.data[0]
            
        except Exception as e:
            print(f"Error writing message to database: {str(e)}")
            raise Exception(f"Error writing message to database: {str(e)}")

    def get_all_children(self, user_id: str):
        try:
            # response = self.client.from_("parent_child_relations").select("child_user_id").eq("parent_user_id", user_id).execute()
            response = self.client.from_("parent_child_relations").select("""*, users:parent_user_id (username, role, user_age), children:child_user_id (username, role, user_age)""").eq("parent_user_id", user_id).execute()
            return response.data
        except Exception as e:
            raise Exception("Error when getting all children: " + str(e))
        
    def add_child(self, parent_user_id: str, child_name: str, child_age: int):
        try:
            response = self.client.from_("users").insert({"username": child_name, "role": "child", "user_age": child_age}).execute()
            child_user_id = response.data[0]["user_id"]
            self.client.from_("parent_child_relations").insert({"parent_user_id": parent_user_id, "child_user_id": child_user_id}).execute()
            return True
        except Exception as e:
            raise Exception("Error when adding child: " + str(e))
        
    def remove_child(self, parent_user_id: str, child_user_id: str):
        try:
            self.client.from_("parent_child_relations").delete().eq("parent_user_id", parent_user_id).eq("child_user_id", child_user_id).execute()
            return True
        except Exception as e:
            raise Exception("Error when removing child: " + str(e))

    def rename_child(self, child_user_id: str, new_name: str):
        try:
            self.client.from_("users").update({"username": new_name}).eq("user_id", child_user_id).execute()
            return True
        except Exception as e:
            raise Exception("Error when renaming child: " + str(e))

    def write_chatbot(self, chatbot_data: dict):
        """
        Write chatbot data to the chatbots table
        Expected chatbot_data structure:
        {
            'chatbot_id': int,
            'name': str,
            'metadata': str,  # JSON string
            'chatbotPlatform': str
        }
        """
        try:
            # Check if chatbot already exists
            response = self.client.from_("chatbots").select("chatbot_id").eq("chatbot_id", chatbot_data['chatbot_id']).execute()
            
            if response.data:
                # Update existing chatbot
                response = self.client.table("chatbots").update(chatbot_data).eq("chatbot_id", chatbot_data['chatbot_id']).execute()
            else:
                # Insert new chatbot
                response = self.client.table("chatbots").insert(chatbot_data).execute()
            
            if not response.data:
                raise Exception("No data returned from chatbot insert/update")
            
            return response.data[0]
            
        except Exception as e:
            print(f"Error writing chatbot to database: {str(e)}")
            raise Exception(f"Error writing chatbot to database: {str(e)}")




if __name__ == "__main__":
    rds_client = RDSClient()
    print(rds_client.get_all_user_email_newsletter_subscribed())

