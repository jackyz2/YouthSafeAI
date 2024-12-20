'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useApi, ConvoData } from "@/controller/API" // Import your API function

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel.toLowerCase()) {
    case 'high':
      return 'bg-red-500 hover:bg-red-600'
    case 'medium':
      return 'bg-yellow-500 hover:bg-yellow-600'
    case 'low':
      return 'bg-green-500 hover:bg-green-600'
    default:
      return 'bg-gray-500 hover:bg-gray-600'
  }
}



interface EventEntryProps {
  event: ConvoData;
}

const EventEntry: React.FC<EventEntryProps> = ({event}) => {
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {new Date(event.start_time).toLocaleString()}
        </CardTitle>
        
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold">{event.chatbotPlatform}</p>
            <p><strong>Chatbot:</strong>{event.chatbotDescription}</p>
            <p><strong>Topics:</strong> {event.conversationTopics}</p>
            <p><strong>Summary:</strong> {event.conversationSummarization}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Reports() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [events, setEvents] = useState<ConvoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getAllConvo } = useApi(); // Retrieve the API function

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  useEffect(() => {
    getAllConvo().then(data => setEvents(data as ConvoData[]));
  }, []);
  // Reverse the events to show the newest on top
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Event Reports</h2>
      <ScrollArea className="h-[600px] w-full rounded-md border p-4">
        {sortedEvents.map((event) => (
          <EventEntry
            key={event.conversation_id}
            event={event}
          />
        ))}
      </ScrollArea>
    </div>
  );
}
