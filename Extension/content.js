console.log('Content script loaded');

// Start the observer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded, initializing observer...');
  setupMessageObserver();
}); 

// Add this at the bottom of content.js
window.addEventListener('load', () => {
  console.log('Window load event fired');
  setupMessageObserver();
});

// Move the observer setup and message extraction here
function setupMessageObserver() {
  console.log('Setting up message observer...');
  
  const chatContainer = document.getElementById('chat-messages');
  if (!chatContainer) {
    console.log('Chat container not found, retrying in 1 second...');
    setTimeout(setupMessageObserver, 1000);
    return;
  }

  console.log('Chat container found:', chatContainer);

  let pendingMessage = null;
  let lastSentMessage = null;
  
  // Process existing messages first
  const messages = extractMessages();
  if (messages.messages && messages.messages.length > 0) {
    pendingMessage = messages.messages[messages.messages.length - 1];
    console.log('Initial pending message:', pendingMessage);
  }
  
  const observer = new MutationObserver((mutations) => {
    console.log('Mutation detected');
    
    const messages = extractMessages();
    if (!messages.messages || messages.messages.length === 0) return;

    const currentMessage = messages.messages[messages.messages.length - 1];
    
    // If we have a pending message and see a new message, the pending one is complete
    if (pendingMessage && 
        currentMessage.content !== pendingMessage.content && 
        currentMessage.author !== pendingMessage.author) {
      
      // Only send if we haven't sent this message before
      if (!lastSentMessage || 
          JSON.stringify(lastSentMessage) !== JSON.stringify(pendingMessage)) {
        console.log('Complete message detected:', pendingMessage);
        
        chrome.runtime.sendMessage({
          type: 'NEW_MESSAGES',
          data: {
            messages: messages.messages, 
            pendingMessage: pendingMessage,
            urlPart: messages.urlPart
          }
        });
        
        lastSentMessage = pendingMessage;
      }
    }
    
    // Update pending message
    pendingMessage = currentMessage;
  });

  const config = { 
    childList: true,
    subtree: true
  };

  observer.observe(chatContainer, config);
  console.log('Message observer setup complete');
}

function extractMessages() {
  console.log('Extracting messages...');
  const messageElements = document.querySelectorAll('div.group.relative.max-w-3xl.m-auto.w-full, div.group.relative.max-w-3xl.m-auto.w-full.p-2');
  console.log('Found message elements:', messageElements.length);
  
  // Get AI name from the page
  const aiNameElement = document.querySelector('a[href*="/character/"] p.font-semi-bold');
  const aiName = aiNameElement ? aiNameElement.textContent.trim() : '';
  
  const messages = [];
  
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


