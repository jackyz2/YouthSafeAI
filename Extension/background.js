chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_MESSAGES') {
    const { messages, pendingMessage, urlPart } = message.data;
    
    // Store messages first
    chrome.storage.local.set({ 
      'chatMessages': messages,
      'pendingMessage': pendingMessage,
      'originalUrl': urlPart 
    }, async () => {
      try {
        // Send to Dify API
        let difyData = await sendToDifyAPI(messages, pendingMessage);
        console.log('Received difyData:', difyData);
        
        // Comprehensive validation of difyData
        if (!difyData) {
          console.error('No data received from Dify API');
          return;
        }

        // Check for required objects
        if (!difyData.ids) {
          console.error('Missing ids in difyData:', difyData);
          return;
        }

        if (!difyData.riskAssessment) {
          console.error('Missing riskAssessment in difyData:', difyData);
          return;
        }

        if (!difyData.riskNotification) {
          console.error('Missing riskNotification in difyData:', difyData);
          return;
        }

        if (!difyData.recentChat) {
          console.error('Missing recentChat in difyData:', difyData);
          return;
        }

        if (!difyData.contextChat) {
          console.error('Missing contextChat in difyData:', difyData);
          return;
        }

        // Check for required fields in ids
        const requiredIds = ['conversationId', 'messageId', 'chatbotId', 'riskEventId'];
        const missingIds = requiredIds.filter(id => !difyData.ids[id]);
        if (missingIds.length > 0) {
          console.error('Missing required ids:', missingIds);
          return;
        }

        // Check for required fields in riskAssessment
        const requiredRiskFields = ['risk_level', 'risk_type', 'risky_reason'];
        const missingRiskFields = requiredRiskFields.filter(field => !difyData.riskAssessment[field]);
        if (missingRiskFields.length > 0) {
          console.error('Missing required risk assessment fields:', missingRiskFields);
          return;
        }

        // Check for required fields in riskNotification
        const requiredNotificationFields = ['conversation_topic', 'conversation_summary'];
        const missingNotificationFields = requiredNotificationFields.filter(field => !difyData.riskNotification[field]);
        if (missingNotificationFields.length > 0) {
          console.error('Missing required risk notification fields:', missingNotificationFields);
          return;
        }

        // If all validations pass, proceed with sending data
        console.log('All data validated, proceeding with sending...');

        await sendChatbot(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
        await sendConversation(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
        await sendMessage(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
        await sendAlert(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
        
        
        
        console.log('All data sent successfully');

      } catch (error) {
        console.error('Error in message processing:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    });
  }
});
// // Add this to automatically start the observer when the page loads
// window.addEventListener('load', () => {
//   console.log('Page loaded, initializing observer...');
//   setupMessageObserver();
// });



// function setupMessageObserver() {
//   console.log('Setting up message observer...');
  
//   // Select the container that holds all messages
//   const chatContainer = document.querySelector('div.overflow-x-hidden overflow-y-scroll px-1 flex flex-col-reverse min-w-full z-0 hide-scrollbar');
  
//   if (!chatContainer) {
//     console.log('Chat container not found, retrying in 1 second...');
//     setTimeout(setupMessageObserver, 1000);
//     return;
//   }

//   let lastProcessedMessage = null;
  
//   const observer = new MutationObserver((mutations) => {
//     for (const mutation of mutations) {
//       if (mutation.addedNodes.length > 0) {
//         const messages = extractMessages();
        
//         // Only process if we have new messages
//         if (messages.messages.length > 0) {
//           const latestMessage = messages.messages[messages.messages.length - 1];
          
//           // Check if this is a new message we haven't processed yet
//           if (!lastProcessedMessage || 
//               JSON.stringify(lastProcessedMessage) !== JSON.stringify(latestMessage)) {
//             console.log('New message detected, processing...');
//             lastProcessedMessage = latestMessage;
            
//             // Store messages first
//             chrome.storage.local.set({ 
//               'chatMessages': messages.messages,
//               'originalUrl': messages.urlPart 
//             }, () => {
//               // Send to Dify API
//               let difyData = sendToDifyAPI(messages.messages);
//               sendAlert(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
//               sendConversation(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
//               sendMessage(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
//               sendChatbot(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
//             });
//           }
//         }
//       }
//     }
//   });

//   // Configure the observer to watch for changes in the chat container
//   const config = { 
//     childList: true, 
//     subtree: true 
//   };
  
//   // Start observing
//   observer.observe(chatContainer, config);
//   console.log('Message observer setup complete');
// }

// chrome.action.onClicked.addListener((tab) => {
//   console.log('Extension clicked, executing script...');
  
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     function: extractMessages
//   }, (results) => {
//     if (results && results[0].result) {
//       const messages = results[0].result.messages;
      
//       // Store messages first
//       chrome.storage.local.set({ 
//         'chatMessages': messages,
//         'originalUrl': results[0].result.urlPart 
//       }, () => {
//         // Send to Dify API
//         let difyData = sendToDifyAPI(messages);
//         sendAlert(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
//         sendConversation(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
//         sendMessage(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
//         sendChatbot(difyData.ids, difyData.riskAssessment, difyData.riskNotification, difyData.recentChat, difyData.contextChat);
//       });
//     }
//   });
// });



async function sendToDifyAPI(messages, pendingMessage) {
  try {
    console.log('Starting sendToDifyAPI process...');
    console.log('Input messages:', messages);

    const maxRetries = 3;
    let currentTry = 0;
    let data;
    let riskAssessment, riskNotification;
    let ids;
    let recentChat, contextChat;

    while (currentTry < maxRetries) {
      currentTry++;
      console.log(`Attempt ${currentTry} of ${maxRetries}`);

      // Split messages into recent and context
      const recent_message = messages.slice(-2);
      const context = messages.slice(0, -2);
      
      // Convert both to strings
      recentChat = recent_message.map(msg => 
        `${msg.sender_type}: ${msg.content}`
      ).join('\n');
      
      contextChat = context.map(msg => 
        `${msg.sender_type}: ${msg.content}`
      ).join('\n');

      console.log('Processed messages:', {
        recentChat,
        contextChat,
        recentMessageCount: recent_message.length,
        contextMessageCount: context.length
      });

      // Get current user IDs
      console.log('Fetching user IDs...');
      const { userId, childUserId } = await getCurrentUserIds();
      console.log('Current user IDs:', { userId, childUserId });

      // Get IDs first
      console.log('Generating IDs from backend...');
      const idsResponse = await fetch('https://preview.teen-ai.salt-lab.org/api/v1/ids/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userId,
          childUserId,
          platform: "CharacterAI"
        })
      });

      if (!idsResponse.ok) {
        const errorText = await idsResponse.text();
        console.error('ID generation failed:', {
          status: idsResponse.status,
          statusText: idsResponse.statusText,
          errorText
        });
        throw new Error(`Failed to generate IDs: ${idsResponse.status} - ${errorText}`);
      }

      ids = await idsResponse.json();
      console.log('Successfully generated IDs:', ids);

      // Call Dify API
      console.log('Calling Dify API...');
      const response = await fetch('[YOUR_DIFY_API_URL]', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': '[YOUR_DIFY_API_KEY]'
        },
        body: JSON.stringify({
          inputs: {
            contextChat: contextChat,
            recentChat: recentChat,
            character_profile: "default"
          },
          response_mode: "blocking",
          user: userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dify API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Dify API error! status: ${response.status}, response: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Raw Dify API Response:', responseText);

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Dify API response:', {
          responseText,
          parseError
        });
        throw new Error(`Failed to parse Dify API response: ${parseError.message}`);
      }

      console.log('Parsed Dify API Response:', data);

      // Check if response contains valid data
      if (!data.data?.outputs?.['Risk Assessment'] || data.data.outputs['Risk Assessment'] === '' ||
          !data.data?.outputs?.['Risk Notification'] || data.data.outputs['Risk Notification'] === '') {
        console.log(`Empty response received on attempt ${currentTry}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * currentTry));
        continue;
      }

      // If we get here, we have valid data
      try {
        riskAssessment = JSON.parse(data.data.outputs['Risk Assessment']);
        riskNotification = JSON.parse(data.data.outputs['Risk Notification']);
        break;
      } catch (parseError) {
        console.error('Failed to parse risk data:', {
          outputs: data.data?.outputs,
          parseError
        });
        if (currentTry === maxRetries) {
          throw new Error(`Failed to parse risk data: ${parseError.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * currentTry));
        continue;
      }
    }

    if (currentTry >= maxRetries && (!riskAssessment || !riskNotification)) {
      throw new Error(`Failed to get valid response from Dify API after ${maxRetries} attempts`);
    }

    console.log('Successfully received and parsed risk data:', {
      assessment: riskAssessment,
      notification: riskNotification
    });

    return {
      ids: ids,
      riskAssessment: riskAssessment,
      riskNotification: riskNotification,
      recentChat: recentChat,
      contextChat: contextChat
    };

  } catch (error) {
    console.error('Error in sendToDifyAPI:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      error
    });
    throw error;
  }
}

// Helper function for getting user IDs
async function getCurrentUserIds() {
  console.log('Getting current user IDs from storage...');
  try {
    const userInfo = await chrome.storage.local.get(['userId', 'childUserId']);
    console.log('Retrieved user info from storage:', userInfo);
    
    return {
      userId: userInfo.userId || "extension-user", // Default fallback
      childUserId: 3 // Default fallback
    };
  } catch (error) {
    console.error('Error getting user IDs from storage:', error);
    // Return defaults if there's an error
    return {
      userId: "extension-user",
      childUserId: 3
    };
  }
}

function extractMessages() {
  const messages = [];
  const messageElements = document.querySelectorAll('div.group.relative.max-w-3xl.m-auto.w-full, div.group.relative.max-w-3xl.m-auto.w-full.p-2');
  
  // Get AI name from the page
  const aiNameElement = document.querySelector('a[href*="/character/"] p.font-semi-bold');
  const aiName = aiNameElement ? aiNameElement.textContent.trim() : '';
  
  Array.from(messageElements).reverse().forEach((element) => {
    const nameElement = element.querySelector('div[class^="text"]') || element.querySelector('div.text-small');
    const messageText = Array.from(element.querySelectorAll('p'))
      .map(p => p.textContent.trim())
      .join(' ');
    
    if (nameElement && messageText) {
      const senderName = nameElement.textContent.trim();
      const sender_type = senderName === aiName ? 'AI' : 'User';
      
      messages.push({
        author: senderName,
        sender_type: sender_type,
        content: messageText
      });
    }
  });
  
  return {
    messages: messages,
    urlPart: window.location.href
  };
} 

async function sendToBackend(Data, dataType) {
  try {
    console.log('Attempting to send data to backend...');
    console.log(dataType);
    let response;
    if (dataType === 'alert') {
      response = await fetch('https://preview.teen-ai.salt-lab.org/api/v1/alerts/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(Data)
    });
    }
    else if (dataType === 'conversation') {
      response = await fetch('https://preview.teen-ai.salt-lab.org/api/v1/conversations/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      body: JSON.stringify(Data)
    });
    }
    else if (dataType === 'message') {
      response = await fetch('https://preview.teen-ai.salt-lab.org/api/v1/messages/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(Data)
      });
    }
    else if (dataType === 'chatbot') {
      response = await fetch('https://preview.teen-ai.salt-lab.org/api/v1/chatbots/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(Data)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend Error Details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        sentData: Data
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Successfully sent to backend:', result);
    return result;

  } catch (error) {
    console.error('Error sending to backend:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function sendAlert(ids, riskAssessment, riskNotification, recentChat, contextChat) {
      if (!ids) {
        console.error('IDs object is undefined');
        return;
      }
  
  // Prepare data for backend
      console.log('Preparing alert data...');
      const alertData = {
        user: "extension-user",
        alert_type: "risk_assessment",
        alert_details: JSON.stringify({
          risk_event_id: ids.riskEventId,
          conversation_id: ids.conversationId,
          child_user_id: 3,
          riskLevel: riskAssessment.risk_level,
          riskType: riskAssessment.risk_type,
          riskyReason: riskAssessment.risky_reason,
          timestamp: new Date().toISOString(),
          messages: recentChat
        })
      };
      console.log('Alert data prepared:', alertData);
      console.log('Sending alert to backend...');
      await sendToBackend(alertData, 'alert');
      console.log('Alert sent successfully');
}

async function sendConversation(ids, riskAssessment, riskNotification, recentChat, contextChat) {
  console.log('Preparing conversation data...');
  const conversationData = {
    conversation_id: ids.conversationId,
    child_user_id: 3,
    chatbot_id: ids.chatbotId,
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    conversation_topic: riskNotification.conversation_topic,
    conversation_summary: riskNotification.conversation_summary,
    messages: contextChat,
    platform: "CharacterAI"
  };
  console.log('Conversation data prepared:', conversationData);

  try {
    // First try to update existing conversation
    console.log('Attempting to update existing conversation...');
    const updateResponse = await fetch(`https://preview.teen-ai.salt-lab.org/api/v1/conversations/update/${ids.conversationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(conversationData)
    });

    if (updateResponse.status === 404) {
      // If conversation doesn't exist, create new one
      console.log('Conversation not found, creating new one...');
      await sendToBackend(conversationData, 'conversation');
    } else if (!updateResponse.ok) {
      // If update failed for other reasons
      const errorText = await updateResponse.text();
      console.error('Failed to update conversation:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        errorText
      });
      throw new Error(`Failed to update conversation: ${updateResponse.status} - ${errorText}`);
    } else {
      console.log('Successfully updated existing conversation');
    }
  } catch (error) {
    console.error('Error in sendConversation:', error);
    throw error;
  }
}

async function sendMessage(ids, riskAssessment, riskNotification, recentChat, contextChat) {
        
      console.log('Preparing message data');
      const messageData = {
        child_user_id: 3,
        message_id: ids.messageId,
        conversation_id: ids.conversationId,
        sender: "extension-user",
        message_text: recentChat,
        timestamp: new Date().toISOString(),
        sender_type: "CharacterAI"
      };
      
      console.log('Sending messages to backend...');
      await sendToBackend(messageData, 'message');
      console.log('Messages sent successfully');
    }

    async function sendChatbot(ids, riskAssessment, riskNotification, recentChat, contextChat) {
      console.log('Preparing chatbot data...');
      const chatbotData = {
        chatbot_id: ids.chatbotId,
        name: 'testBot',
        metadata: {
          "version": "1.0",
          "language": "en"
        },
        chatbotPlatform: "CharacterAI"
      };
      console.log('Chatbot data prepared:', chatbotData);
  
      // Send to backend
      console.log('Sending chatbot to backend...');
      await sendToBackend(chatbotData, 'chatbot');
      console.log('Chatbot sent successfully');
    }