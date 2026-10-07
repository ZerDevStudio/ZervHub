import React from 'react'
import { motion } from 'framer-motion'
import { FolderGit2 } from 'lucide-react'
import { useTeamCollections } from '../../lib/teamCollections/TeamCollectionsContext'
import { cyberAudio } from '../../lib/cyberAudio'

export const TeamCollectionsBadge: React.FC = () => {
  const { collections } = useTeamCollections()

  const handleClick = () => {
    try {
      cyberAudio.click()
    } catch {}
    window.dispatchEvent(new CustomEvent('nexus:open-team-collections'))
  }

  const count = collections.length

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="no-drag flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border border-nexus-cyan/30 bg-nexus-cyan/5 hover:border-nexus-cyan/60 hover:bg-nexus-cyan/15 text-nexus-cyan transition-all cursor-pointer shadow-sm shadow-nexus-cyan/10"
      title="Paylaşılabilir Takım Koleksiyonları (API, Regex, Cron, Mermaid)"
    >
      <FolderGit2 className="w-3 h-3 text-nexus-cyan" />
      <span className="hidden sm:inline font-medium">Koleksiyonlar</span>
      <span className="px-1 rounded-full bg-nexus-cyan/20 text-[9px] font-bold">
        {count}
      </span>
    </motion.button>
  )
}
