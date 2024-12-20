// src/api/api.ts

import { useContext } from "react";
import { useCallback } from "react";
import axios, { AxiosResponse } from "axios";

import { toast } from "@/hooks/use-toast";

export interface ConvoData {
  conversation_id: number;
  conversationTopics: string;
  conversationSummarization: string;
  start_time: string;
  end_time: string;
  chatbotPlatform: string;
  chatbotDescription: string;
}

export interface ConversationData {
  username: string;
  riskyEvent_id: number;
  conversation_id: number;
  conversationTopics: string;
  conversationSummarization: string;
  riskType: string;
  riskLevel: string;
  riskyReason: string;
  timestamp: string;
  chatbotPlatform: string;
  chatbotDescription: string;
}

export interface ConversationTimes {
  id: number;
  start_time: string;
  end_time: string;
}

export interface EmailNotificationData {
  email: string;
  child_name: string;
  risk_level: string;
  redirect_url: string;
}

export interface AddChildData {
  parent_user_id: string;
  child_name: string;
  child_age: number;
} 

export interface RemoveChildData {
  parent_user_id: string;
  child_user_id: string;
}

export interface RenameChildData {
  child_user_id: string;
  new_name: string;
}

export function useApi() {
  // Helper function for standardized API calls with error handling
  const apiCall = async <T>(
    url: string, 
    method: string, 
    data: any, 
    additionalHeaders: Record<string, string> = {}
  ): Promise<AxiosResponse<T>> => {
    // prepare headers
    const headers = {};

    // Merge additional headers, overriding existing ones if necessary
    const finalHeaders = { ...headers, ...additionalHeaders };

    try {
      const response = await axios({
        url,
        method,
        data,
        headers: finalHeaders,
      });
      return response;
    } catch (error: any) {
      if (error.response.status === 491) {
        toast({ 
          variant: "destructive",
          title: error.response.status,
          description: error.response.data.detail,
        });
        throw error;
      }
      toast({ 
        variant: "destructive",
        title: error.response.status,
        description: error.response.data.detail,
      });
      throw error;
    }
  };

  // Function to call the get_all_conversations endpoint
  const getAllConversations = async () : Promise<ConversationData[]> => {
    try {
      const response = await apiCall<ConversationData[]>(
        "api/v1/parental_control/get_all_conversations", // URL
        "GET", // HTTP method
        null // No data needed for GET request
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  };

  const getConversationTimes = async () : Promise<ConversationTimes[]> => {
    try {
      const response = await apiCall<ConversationTimes[]>(
        "api/v1/parental_control/get_conversation_times", // URL
        "GET", // HTTP method
        null // No data needed for GET request
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  const getRiskyEventById = async (id: number): Promise<ConversationData> => {
    try {
      const response = await apiCall<ConversationData>(
        `/api/v1/parental_control/get_risky_event_by_id/${id}`, // URL with the riskyEvent ID
        "GET", // HTTP method
        null // No data needed for GET request
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching risky event with ID ${id}:`, error);
      throw error;
    }
  };
  
  const getAllConvo = async () : Promise<ConvoData[]> => {
    try {
      const response = await apiCall<ConvoData[]>(
        "api/v1/parental_control/get_all_convo", // URL
        "GET", // HTTP method
        null // No data needed for GET request
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  };
  

  const sendEmailNotification = async (data: EmailNotificationData) => {
    await apiCall("api/v1/notify/email", "POST", data);
  }

  const getAllChildren = async () => {
    return apiCall("api/v1/family/get_all_children", "GET", null);
  }

  const addChild = async (data: AddChildData) => {
    return apiCall("api/v1/family/add_child", "POST", data);
  }

  const removeChild = async (data: RemoveChildData) => {
    return apiCall("api/v1/family/remove_child", "POST", data);
  }

  const renameChild = async (data: RenameChildData) => {
    return apiCall("api/v1/family/rename_child", "POST", data);
  }
    
  return {
    getAllConversations,
    getRiskyEventById,
    getConversationTimes,
    getAllConvo,
    sendEmailNotification,
    getAllChildren,
    addChild,
    removeChild,
    renameChild,
  };
}
