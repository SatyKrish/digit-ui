import { useMemo } from 'react'
import { ChatSession, GroupedChatSessions, TimePeriod } from '@/types/chat'
import { getTimePeriod, getTimePeriodLabel } from '@/utils/format'

/**
 * Hook to group chat sessions by time periods
 */
export function useGroupedChatSessions(sessions: ChatSession[]): {
  groupedSessions: GroupedChatSessions
  groupOrder: TimePeriod[]
  getGroupLabel: (period: TimePeriod) => string
} {
  const groupedSessions = useMemo(() => {
    const groups: GroupedChatSessions = {}
    
    sessions.forEach(session => {
      // Use updatedAt if available, otherwise use timestamp
      const date = session.updatedAt || session.timestamp
      const period = getTimePeriod(date)
      
      if (!groups[period]) {
        groups[period] = []
      }
      groups[period]!.push(session)
    })
    
    // Sort sessions within each group by most recent first
    Object.keys(groups).forEach(key => {
      const period = key as TimePeriod
      if (groups[period]) {
        groups[period]!.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.timestamp).getTime()
          const dateB = new Date(b.updatedAt || b.timestamp).getTime()
          return dateB - dateA // Most recent first
        })
      }
    })
    
    return groups
  }, [sessions])
  
  const groupOrder = useMemo(() => {
    const periods: TimePeriod[] = ['today', 'yesterday', 'last-week', 'last-month', 'older']
    return periods.filter(period => groupedSessions[period] && groupedSessions[period]!.length > 0)
  }, [groupedSessions])
  
  const getGroupLabel = (period: TimePeriod) => getTimePeriodLabel(period)
  
  return {
    groupedSessions,
    groupOrder,
    getGroupLabel
  }
}
