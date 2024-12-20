import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import { useApi, ConversationData } from '@/controller/API';
import companionIcon from "@/assets/companionicon.jpg";
import { Badge } from "@/components/ui/badge"


export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getRiskyEventById } = useApi();
  const [messages, setMessages] = useState<{ sender: string; text?: string; json?: any }[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [hasSentAIInfo, setHasSentAIInfo] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      getRiskyEventById(Number(id))
        .then((data) => {
          if (data) {
            console.log('Received data:', data);
            setEvent(data);
          } else {
            setError('Event not found.');
          }
        })
        .catch((error) => {
          console.error('Error fetching risky event:', error);
          setError('Failed to fetch the risky event.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError('Invalid event ID.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "high":
        return "bg-red-400 text-white";
      case "medium":
        return "bg-yellow-400 text-white";
      case "low":
        return "bg-green-400 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };
  

  const sendAIInfo = async () => {
    try {
      if (!event) return;
      const contextChat = `
      The event information as context:
            Conversation Data:
            Risk Level: ${event.riskLevel}
            Risk Type: ${event.riskType}
            Risky Reason: ${event.riskyReason}
            Topics: ${event.conversationTopics}
            Summary: ${event.conversationSummarization}
      Query: You are a parent companion who is an expert at handling child's interaction with AI. You can list a few helpful resources and recommended actions for the parent to take. Do not expand on those resources or actions specifically, instead output them as json following this exact format:
      {
  "Resources": [
    {
      "Title": "xxx",
      "Link": "xxx"
    },
    {
      "Title": "xxx",
      "Link": "xxx"
    }
  ],
  "Actions": [
    {
      "Action": "xxx"
    },
    {
      "Action": "xxx"
    }
  ]
}
      `;

      console.log(contextChat);
      const response = await fetch("[YOUR_DIFY_API_URL]", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "[YOUR_DIFY_API_KEY]",
        },
        body: JSON.stringify({
          inputs: "",
          query: contextChat,
          response_mode: "blocking",
          user: "parent-user",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Dify API Error:", errorData);
        throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("Dify API Initial Response:", data);

      // Attempt to parse the returned answer as JSON (only for this initial message)
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(data.answer.trim());
      } catch (e) {
        // If parsing fails, just treat as text
      }

      if (parsedJson && typeof parsedJson === 'object') {
        setMessages((prev) => [...prev, { sender: "Companion", json: parsedJson }]);
      } else {
        setMessages((prev) => [...prev, { sender: "Companion", text: data.answer }]);
      }
    } catch (error) {
      console.error("Error communicating with Dify API for initial recommendations:", error);
      setMessages((prev) => [...prev, { sender: "Companion", text: "Failed to fetch initial recommendations." }]);
    }
  };

  const handleSendMessage = async (query: string) => {
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { sender: "User", text: query }]);
    setCurrentMessage("");

    try {
      const response = await fetch("[YOUR_DIFY_API_URL]", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "[YOUR_DIFY_API_KEY]",
        },
        body: JSON.stringify({
          inputs: "",
          query,
          response_mode: "streaming", // Ensure streaming mode is enabled
          user: "parent-user",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Dify API Error:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`
        );
      }

      let botMessage = { sender: "Companion", text: "" };
      setMessages((prev) => [...prev, botMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) return;

      let buffer = ""; // To accumulate partial chunks

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode the chunk into text
        buffer += decoder.decode(value, { stream: true });

        // Split by newline to process line by line
        const lines = buffer.split("\n");
        // Keep the last partial line in buffer if it's not complete
        buffer = lines.pop() || "";

        for (const line of lines) {
          // Trim whitespace
          const trimmed = line.trim();

          // Check if the line starts with 'data:'
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.substring("data:".length).trim();
            if (jsonStr) {
              try {
                const eventData = JSON.parse(jsonStr);
                // Append the 'answer' from eventData to botMessage.text
                if (eventData.answer) {
                  botMessage = { ...botMessage, text: botMessage.text + eventData.answer };
                  // Update state with the new text
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = botMessage;
                    return updated;
                  });
                }
              } catch (err) {
                console.error("Failed to parse SSE JSON:", err);
              }
            }
          }
        }
      }

      // Stream ended
    } catch (error) {
      console.error("Error communicating with Dify API:", error);
      setMessages((prev) => [...prev, { sender: "Companion", text: "Failed to fetch response from GPT." }]);
    }
  };



  useEffect(() => {
    if (event && !hasSentAIInfo) {
      sendAIInfo();
      setHasSentAIInfo(true);
    }
  }, [event, hasSentAIInfo]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4">Error: {error}</div>;
  }

  if (!event) {
    return <div className="container mx-auto p-4">No event data available.</div>;
  }

  const renderInteractiveMessage = (json: any) => {
    return (
      <div>
        <div className="mb-4">
          <strong>Resources:</strong>
          <ul>
            {json.Resources && json.Resources.map((resource: any, idx: number) => (
              <li key={idx}>
                <a
                  href={resource.Link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  {resource.Title}
                </a>
                <button
                  onClick={() => handleSendMessage(`Expand on the resource: ${resource.Title}`)}
                  className="ml-2 text-sm text-blue-500 underline"
                >
                  Explain further
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Actions:</strong>
          <ul>
            {json.Actions && json.Actions.map((action: any, idx: number) => (
              <li key={idx}>
                <span>{action.Action}</span>
                <button
                  onClick={() => handleSendMessage(`Expand on the action: ${action.Action}`)}
                  className="ml-2 text-sm text-blue-500 underline"
                >
                  Explain further
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 flex gap-4">
      <div className="h-[90vh] w-1/3 border p-4 rounded-lg bg-white">
        <div className="flex flex-col gap-4 h-full">
          <Card>
            <CardHeader>
              <CardTitle>{new Date(event.timestamp).toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Risk Level:</strong> 
              <Badge className={getRiskColor(event.riskLevel)}>{event.riskLevel}</Badge>
              </p>
              
              {/* Horizontal bar for risk level */}
              <div className="relative w-full h-4 bg-gray-200 rounded-full mt-2">
                <div
                  className={`h-full rounded-full ${event.riskLevel.toLowerCase() === "low"
                      ? "bg-green-400 w-1/3"
                      : event.riskLevel.toLowerCase() === "medium"
                        ? "bg-yellow-400 w-2/3"
                        : "bg-red-400 w-full"
                    }`}
                ></div>
              </div>
              <p><strong>Risk Type:</strong> {event.riskType}</p>
              <p><strong>Risky Reason:</strong> {event.riskyReason}</p>
            </CardContent>

          </Card>
          <Card>
            <CardContent>
              <p><strong>Conversation Topic:</strong> {event.conversationTopics}</p>
              <p><strong>Conversation Summary:</strong> {event.conversationSummarization}</p>
              <p><strong>Chatbot:</strong> {event.chatbotDescription}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="h-[90vh] w-2/3 border p-4 rounded-lg bg-white">
        <h2 className="text-lg font-bold mb-4">Chat with Companion</h2>
        <div className=" h-[73vh] overflow-y-auto border rounded p-4 mb-4 bg-white">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 flex items-start ${msg.sender === "User" ? "justify-end" : "justify-start"
                }`}
            >
              {/* Icon for AI Companion */}
              {msg.sender === "Companion" && (
                <img
                  src={companionIcon} // Replace with the correct path to your generated AI image
                  alt="AI Companion"
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <span
                className={`block p-2 rounded max-w-md ${msg.sender === "User"
                  ? "bg-blue-200 text-right"
                  : "bg-gray-200 text-left"
                  }`}
              >
                <strong>{msg.sender}:</strong>{" "}
                {msg.json ? renderInteractiveMessage(msg.json) : msg.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 bg-white">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-grow border rounded p-2 bg-white"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
          />
          <button
            onClick={() => handleSendMessage(currentMessage)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
