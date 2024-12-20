'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar } from "recharts";
import { Button } from "@/components/ui/button";
//import * as Tooltip from '@radix-ui/react-tooltip';
import { Tooltip as TTooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Home, AlertTriangle, MessageCircle, Settings } from 'lucide-react';
import Reports from '@/components/reportpage';
import Conversations from '@/components/conversationpage';
import { useApi } from "@/controller/API";
import supabase from "../../stores/supabaseClient";
import { subscribeToRiskEvents } from "../../stores/supabaseClient";
import RiskTypePieChart from '../riskPieChart';
import { Info } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from '@/stores/appStore';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface ConversationData {
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

interface BriefData {
  date: string;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  riskTypeCount: Record<string, number>;
}

interface RiskCountBoxProps {
  title: string;
  count: number;
  color: string;
  globalAverage?: number;
}

interface User {
  email: string;
  isLoggedIn: boolean;
}

interface NavigationProps {
  activePage: string;
  setActivePage: React.Dispatch<React.SetStateAction<string>>;
}

interface SupabaseInsertPayload<T> {
  new: T; // Represents the new row data
}

interface RiskScoreBoxProps {
  title: string;
  low: number;
  medium: number;
  high: number;
  globalAverage?: number;
}

const RiskScoreBox: React.FC<RiskScoreBoxProps> = ({ title, low, medium, high, globalAverage=0.6 }) => {
  
  const totalEvents = low + medium + high;
  let riskScore: number | null = null;

  if (totalEvents > 0) {
    riskScore = ((low * 0.1) + (medium * 0.3) + (high * 0.7)) / totalEvents;
  }
  if(riskScore == null) riskScore = 1;
  const comparisonPercentage = ((riskScore - globalAverage) / globalAverage) * 100;

  return (
    <Card className="shadow-lg w-full relative">
  <CardHeader className="pb-3">
    <CardTitle className="text-md font-semibold text-gray-600">
      {title}
    </CardTitle>
    <TooltipProvider>
      <TTooltip>
        <TooltipTrigger asChild>
          <span className="absolute top-2 right-2">
            <Info className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Higher score indicates higher risk over the selected period.
        </TooltipContent>
      </TTooltip>
    </TooltipProvider>
  </CardHeader>
  <CardContent>
    {riskScore === null ? (
      <div className="text-3xl font-bold text-black">N/A</div>
    ) : (
      <div className="text-3xl font-bold text-black">{riskScore.toFixed(2)}</div>
    )}
    <div className="text-sm text-gray-500 mt-2">
          {comparisonPercentage > 0
            ? `Above global average by ${comparisonPercentage.toFixed(1)}%`
            : comparisonPercentage < 0
              ? `Below global average by ${Math.abs(Number(comparisonPercentage.toFixed(1)))}%`
              : `Equal to global average`}
        </div>
  </CardContent>
</Card>


  );
};


const RiskCountBox: React.FC<RiskCountBoxProps> = ({ title, count, color, globalAverage = 100 }) => {
  const comparisonPercentage = ((count - globalAverage) / globalAverage) * 100;

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-semibold text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" style={{ color }}>{count}</div>
        <div className="text-sm text-gray-500 mt-2">
          {comparisonPercentage > 0
            ? `Above global average by ${comparisonPercentage.toFixed(1)}%`
            : comparisonPercentage < 0
              ? `Below global average by ${Math.abs(Number(comparisonPercentage.toFixed(1)))}%`
              : `Equal to global average`}
        </div>
      </CardContent>
    </Card>
  );
};

const UsageTimeBox: React.FC<{ title: string; timeInHours: number | null; globalAverage: number }> = ({ title, timeInHours = 0, globalAverage = 100 }) => {
  if (timeInHours == null) {
    timeInHours = 0;
  }
  const comparisonPercentage = ((timeInHours - globalAverage) / globalAverage) * 100;
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-semibold text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-blue-600">
          {timeInHours !== null ? `${timeInHours.toFixed(2)} hrs` : "Calculating..."}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {comparisonPercentage > 0
            ? `Above global average by ${comparisonPercentage.toFixed(1)}%`
            : comparisonPercentage < 0
              ? `Below global average by ${Math.abs(Number(comparisonPercentage.toFixed(1)))}%`
              : `Equal to global average`}
        </div>
      </CardContent>
    </Card>
  );
};


const Navigation: React.FC<NavigationProps> = ({ activePage, setActivePage }) => (
  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
    <h1 className="text-4xl font-extrabold justify-center text-gray-800">Parental Control Dashboard</h1>
    <NavigationMenu>
      <NavigationMenuList>
        {['Dashboard', 'Risky Event Reports', 'Conversation History', 'Settings'].map((page) => (
          <NavigationMenuItem key={page}>
            <NavigationMenuLink asChild>
              <a
                href="#"
                onClick={() => setActivePage(page)}
                className={`block px-4 py-2 rounded-md border border-gray-200 ${activePage === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
              >
                {page}
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  </div>
);

interface HighRiskAlertProps {
  show: boolean;
  onClose: () => void;
}

const HighRiskAlert: React.FC<HighRiskAlertProps> = ({ show, onClose }) => {
  const { toast } = useToast();

  useEffect(() => {
    if (show) {
      toast({
        variant: "destructive",
        title: "High Risk Detected!",
        action: (
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
        ),
      });
    }
    // onClose();
  }, [show, toast, onClose]);

  return null;
};

export default function Dashboard() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [user, setUser] = useState<User>({ email: '', isLoggedIn: false });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const { getAllConversations, sendEmailNotification } = useApi();
  const [totalUsageTime, setTotalUsageTime] = useState<number | null>(null);
  const [conversationCount, setConversationCount] = useState(0);

  const { conversations, setConversations, addConversations, showAlert, setShowAlert, clearAlert } = useAppStore();

  useEffect(() => {
    const fetchAndCalculateConversationTimes = async () => {
      try {
        const { getConversationTimes } = useApi(); // Ensure this function is implemented in useApi
        const conversationTimes = await getConversationTimes();

        // Get the current date and calculate the date 7 days ago
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        // Filter conversations within the last 7 days
        const recentConversations = conversationTimes.filter((conversation) => {
          const startTime = new Date(conversation.start_time);
          return startTime >= sevenDaysAgo && startTime <= today;
        });

        // Find the earliest start time and the latest end time
        let earliestStartTime = Infinity;
        let latestEndTime = -Infinity;

        recentConversations.forEach((conversation) => {
          const startTime = new Date(conversation.start_time).getTime();
          const endTime = new Date(conversation.end_time).getTime();

          if (startTime < earliestStartTime) earliestStartTime = startTime;
          if (endTime > latestEndTime) latestEndTime = endTime;
        });

        // Calculate the total time in hours
        if (earliestStartTime !== Infinity && latestEndTime !== -Infinity) {
          const totalTimeInHours = (latestEndTime - earliestStartTime) / (1000 * 60 * 60);
          console.log(`Total active time in the last 7 days: ${totalTimeInHours.toFixed(2)} hours`);
          setTotalUsageTime(totalTimeInHours);
        } else {
          console.log("No conversation times found in the last 7 days.");
          setTotalUsageTime(0);
        }

        setConversationCount(conversationTimes.length);
      } catch (error) {
        console.error("Error fetching or calculating conversation times:", error);
        setTotalUsageTime(null);
      }
    };

    fetchAndCalculateConversationTimes();
  }, []);

  // Fetch conversations once and subscribe to realtime updates
  useEffect(() => {
    // Fetch initial conversations
    const fetchConversations = async () => {
      try {
        const data = await getAllConversations();
        setConversations(data as ConversationData[]);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    fetchConversations();

    // Realtime subscription
    const channel = subscribeToRiskEvents((payload: RealtimePostgresInsertPayload<ConversationData>) => {
      console.log("Realtime event received:", payload);
      const newConversation = payload.new;
      if (newConversation.riskLevel?.toLowerCase() === "high") {
        setShowAlert(true);
      }
      // Add the new conversation to the state
      addConversations([newConversation]);

      // send out email notification
      // sendEmailNotification({
      //   email: "yirenl2@illinois.edu",
      //   child_name: "child_emily",
      //   risk_level: "High",
      //   redirect_url: "https://preview.teen-ai.salt-lab.org/reports/63"
      // });
    });

    // Cleanup the subscription on unmount
    return () => {
      channel.unsubscribe();
      console.log("Unsubscribed from realtime updates.");
    };
  }, []);



  // Calculate risk summary data for the last 7 days
  const briefData: BriefData[] = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const riskData: BriefData[] = last7Days.map((date) => ({
      date,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      riskTypeCount: {},
    }));



    conversations.forEach((conversation) => {
      const conversationDate = new Date(conversation.timestamp)
        .toISOString()
        .split("T")[0];
      const riskLevel = conversation.riskLevel.toLowerCase();
      const riskType = conversation.riskType || "Unknown";
      const riskEntry = riskData.find((entry) => entry.date === conversationDate);
      if (riskEntry) {
        if (riskLevel === "low") riskEntry.lowRisk++;
        if (riskLevel === "medium") riskEntry.mediumRisk++;
        if (riskLevel === "high") riskEntry.highRisk++;
        riskEntry.riskTypeCount[riskType] = (riskEntry.riskTypeCount[riskType] || 0) + 1;
      }
    });

    return riskData;
  }, [conversations]);

  const todayData = briefData.reduce(
    (totals, entry) => ({
      lowRisk: totals.lowRisk + entry.lowRisk,
      mediumRisk: totals.mediumRisk + entry.mediumRisk,
      highRisk: totals.highRisk + entry.highRisk,
    }),
    { lowRisk: 0, mediumRisk: 0, highRisk: 0 } // Initial values
  );

  const riskTypeDistribution = useMemo(() => {
    const riskTypeMap: Record<string, number> = {};

    briefData.forEach((day) => {
      Object.entries(day.riskTypeCount).forEach(([riskType, count]) => {
        riskTypeMap[riskType] = (riskTypeMap[riskType] || 0) + count;
      });
    });

    // Convert the map into an array format suitable for the PieChart
    return Object.entries(riskTypeMap).map(([name, value]) => ({ name, value }));
  }, [briefData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      setUser({ email: loginEmail, isLoggedIn: true });
      localStorage.setItem('user', JSON.stringify({ email: loginEmail, isLoggedIn: true }));
      setError('');
    } else {
      setError('Please enter both email and password');
    }
  };

  const handleLogout = () => {
    setUser({ email: '', isLoggedIn: false });
    localStorage.removeItem('user');
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail) {
      setUser({ ...user, email: newEmail });
      localStorage.setItem('user', JSON.stringify({ ...user, email: newEmail }));
      setNewEmail('');
      setError('');
    } else {
      setError('Please enter a new email');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword) {
      setNewPassword('');
      setError('');
    } else {
      setError('Please enter a new password');
    }
  };

  return (

    <div className="container mx-auto p-4">


      <HighRiskAlert show={showAlert} onClose={() => setShowAlert(false)} />

      <main>
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <UsageTimeBox title="Total Usage Time (7 Days)" timeInHours={totalUsageTime} globalAverage={20} />
            <RiskCountBox title="Conversations" count={conversationCount} color="black" globalAverage={5} />
            <RiskCountBox title="High Risk Events" count={todayData.highRisk} color="red" globalAverage={3} />
            <RiskScoreBox
              title="Risk Score"
              low={todayData.lowRisk}
              medium={todayData.mediumRisk}
              high={todayData.highRisk}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-center">
            <Card className="w-full h-[500px] shadow-lg">
              <CardHeader>
                <CardTitle>Risk Frequency (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <ResponsiveContainer width="85%" height="85%">
                  <BarChart data={briefData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lowRisk" fill="green" name="Low Risk" />
                    <Bar dataKey="mediumRisk" fill="orange" name="Medium Risk" />
                    <Bar dataKey="highRisk" fill="red" name="High Risk" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <RiskTypePieChart data={riskTypeDistribution} />
          </div>
        </>
      </main>

      <footer className="mt-12 text-center text-gray-500">

      </footer>
    </div>

  );
}