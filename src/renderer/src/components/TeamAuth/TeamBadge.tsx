import React from 'react'
import { motion } from 'framer-motion'
import { Users, Crown, Shield, User, Eye } from 'lucide-react'
import { useTeamAuth } from '../../lib/teamAuth/TeamAuthContext'
import { TeamRole } from '../../lib/teamAuth/types'
import { cyberAudio } from '../../lib/cyberAudio'

export const TeamBadge: React.FC = () => {
  const { currentRole, session } = useTeamAuth()

  const handleClick = () => {
    try {
      cyberAudio.click()
    } catch {}
    window.dispatchEvent(new CustomEvent('nexus:open-team-modal'))
  }

  const getRoleBadge = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return {
          icon: <Crown className="w-2.5 h-2.5 text-amber-400" />,
          label: 'OWNER',
          color: 'bg-amber-500/15 border-amber-500/30 text-amber-300'
        }
      case 'admin':
        return {
          icon: <Shield className="w-2.5 h-2.5 text-nexus-cyan" />,
          label: 'ADMIN',
          color: 'bg-nexus-cyan/15 border-nexus-cyan/30 text-nexus-cyan'
        }
      case 'member':
        return {
          icon: <User className="w-2.5 h-2.5 text-purple-400" />,
          label: 'MEMBER',
          color: 'bg-purple-500/15 border-purple-500/30 text-purple-300'
        }
      case 'viewer':
        return {
          icon: <Eye className="w-2.5 h-2.5 text-nexus-muted" />,
          label: 'VIEWER',
          color: 'bg-white/5 border-white/10 text-nexus-muted'
        }
    }
  }

  const badge = getRoleBadge(currentRole)

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="no-drag flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border border-white/10 bg-white/5 hover:border-nexus-cyan/40 hover:bg-nexus-cyan/10 transition-all cursor-pointer"
      title={`${session.organization.name} (${badge.label})`}
    >
      <Users className="w-3 h-3 text-nexus-muted" />
      <span className="hidden md:inline text-nexus-muted font-medium truncate max-w-[100px]">
        {session.organization.name.split(' ')[0]}
      </span>
      <span className={`flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold ${badge.color}`}>
        {badge.icon}
        <span>{badge.label}</span>
      </span>
    </motion.button>
  )
}
