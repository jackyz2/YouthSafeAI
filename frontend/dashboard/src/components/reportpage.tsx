"use client"

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { useApi, ConversationData } from "@/controller/API"
import { DataTable } from '@/components/data_table'
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Link } from 'react-router-dom'

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

const columns: ColumnDef<ConversationData>[] = [
  {
    accessorKey: "timestamp",
    header: "Date",
    cell: ({ row }) => {
      return new Date(row.getValue("timestamp")).toLocaleString()
    },
  },
  {
    accessorKey: "username",
    header: "Child"
  },
  {
    accessorKey: "riskType",
    header: "Risk Type",
  },
  {
    accessorKey: "riskLevel",
    header: "Risk Level",
    cell: ({ row }) => {
      const riskLevel = row.getValue("riskLevel") as string
      return (
        <Badge className={getRiskColor(riskLevel)}>{riskLevel}</Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.length === 0 ? true : value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const event = row.original;

      return (
        <Button
          variant="link"
          className="text-violet-500 hover:text-violet-600"
          asChild
        >
          <Link to={`/reports/${event.riskyEvent_id}`}>View Details</Link>
        </Button>
      );
    },
  },
]

export default function Reports() {
  const [events, setEvents] = useState<ConversationData[]>([])
  const [filteredEvents, setFilteredEvents] = useState<ConversationData[]>([])
  const [childFilter, setChildFilter] = useState<string>("All") // Dropdown filter state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { getAllConversations } = useApi()

  useEffect(() => {
    getAllConversations()
      .then(data => {
        setEvents(data as ConversationData[])
        setFilteredEvents(data as ConversationData[]) // Initialize filtered events
        setLoading(false)
      })
      .catch(err => {
        setError("Failed to fetch conversations")
        setLoading(false)
      })
  }, [])

  // Update filtered events whenever the filter changes
  useEffect(() => {
    if (childFilter === "All") {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter(event => event.username === childFilter))
    }
  }, [childFilter, events])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  // Extract unique child names for the dropdown
  const childNames = Array.from(new Set(events.map(event => event.username))).sort()

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Event Reports</h2>
      
      {/* Dropdown Filter */}
      <div className="mb-4">
        <label htmlFor="childFilter" className="mr-2 font-medium">Filter by Child:</label>
        <select
          id="childFilter"
          value={childFilter}
          onChange={(e) => setChildFilter(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 bg-white"
        >
          <option value="All">All</option>
          {childNames.map((name, idx) => (
            <option key={idx} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={filteredEvents} />
    </div>
  )
}
