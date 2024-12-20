document.addEventListener('DOMContentLoaded', function() {
  const historyDiv = document.getElementById('history');
  const responseDiv = document.getElementById('response');
  
  chrome.storage.local.get(['recentMessage', 'contextMessages', 'difyResponse'], function(result) {
    // Display chat history with separation
    if (result.contextMessages && result.recentMessage) {
      // Display context messages
      const contextHtml = result.contextMessages.map(message => `
        <div class="message ${message.sender_type.toLowerCase()}-message">
          <div class="sender-type">${message.sender_type}</div>
          <div class="content">${message.content}</div>
        </div>
      `).join('');

      // Display recent message with different styling
      const recentHtml = result.recentMessage.map(message => `
        <div class="message ${message.sender_type.toLowerCase()}-message recent">
          <div class="sender-type">${message.sender_type}</div>
          <div class="content">${message.content}</div>
        </div>
      `).join('');

      historyDiv.innerHTML = `
        <div class="context-messages">
          <h4>Previous Messages</h4>
          ${contextHtml}
        </div>
        <div class="recent-messages">
          <h4>Latest Conversation</h4>
          ${recentHtml}
        </div>
      `;
    } else {
      historyDiv.innerHTML = `
        <div class="error">
          No chat messages found. Make sure you're on a page with chat messages.
        </div>
      `;
    }

    // Display Dify response
    if (result.difyResponse && result.difyResponse.data) {
      const outputs = result.difyResponse.data.outputs;
      responseDiv.innerHTML = `
        <div class="risk-assessment">
          <h4>Risk Assessment</h4>
          <div class="content">
            ${formatMarkdown(outputs['Risk Assessment'])}
          </div>
        </div>
        <div class="risk-notification">
          <h4>Risk Notification</h4>
          <div class="content">
            ${formatMarkdown(outputs['Risk Notification'])}
          </div>
        </div>
      `;
    }
  });
});

// Helper function to format markdown-style text
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold text
    .replace(/\n\n/g, '</p><p>') // Paragraphs
    .replace(/\n-/g, '<br>•') // Bullet points
    .replace(/\n([^•])/g, '<br>$1'); // Line breaks
} 