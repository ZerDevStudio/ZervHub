import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Users,
  UserPlus,
  Shield,
  Crown,
  User,
  Eye,
  Trash2,
  Check,
  Building,
  KeyRound,
  ExternalLink,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react'
import { useTeamAuth } from '../../lib/teamAuth/TeamAuthContext'
import { TeamRole, Permission } from '../../lib/teamAuth/types'
import { ROLE_PERMISSIONS } from '../../lib/teamAuth/teamAuthManager'
import { useT } from '../../lib/i18n'
import { useToast } from '../../lib/ToastContext'
import { cyberAudio } from '../../lib/cyberAudio'

export const TeamMembersModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'permissions' | 'sso'>('members')

  const {
    session,
    members,
    currentRole,
    hasPermission,
    inviteMember,
    updateMemberRole,
    removeMember,
    login
  } = useTeamAuth()

  const { t, locale } = useT()
  const { success: showToastSuccess, error: showToastError } = useToast()
  const isTr = locale === 'tr'

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('member')
  const [isInviting, setIsInviting] = useState(false)

  // Listen to open events
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      setIsInviting(false)
      try {
        cyberAudio.click()
      } catch {}
    }
    window.addEventListener('nexus:open-team-modal', handleOpen)
    return () => window.removeEventListener('nexus:open-team-modal', handleOpen)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const canManageMembers = hasPermission('members:manage')

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      const created = inviteMember(inviteEmail.trim(), inviteRole, inviteName.trim())
      setInviteEmail('')
      setInviteName('')
      setIsInviting(false)
      try {
        cyberAudio.copySuccess()
      } catch {}
      showToastSuccess(
        isTr ? 'Davet Gönderildi' : 'Invitation Sent',
        isTr ? `${created.email} takım çalışma alanına davet edildi.` : `${created.email} invited to the team workspace.`
      )
    } catch (err: any) {
      showToastError(isTr ? 'Davet Başarısız' : 'Invite Failed', err.message)
    }
  }

  const handleRoleChange = (memberId: string, newRole: TeamRole) => {
    try {
      updateMemberRole(memberId, newRole)
      try {
        cyberAudio.copySuccess()
      } catch {}
      showToastSuccess(
        isTr ? 'Rol Güncellendi' : 'Role Updated',
        isTr ? `Üye yetkisi ${newRole.toUpperCase()} olarak değiştirildi.` : `Role updated to ${newRole.toUpperCase()}.`
      )
    } catch (err: any) {
      showToastError(isTr ? 'Hata' : 'Error', err.message)
    }
  }

  const handleRemove = (memberId: string, memberName: string) => {
    if (!confirm(isTr ? `"${memberName}" adlı üyeyi takımdan çıkarmak istediğinize emin misiniz?` : `Remove ${memberName} from team?`)) {
      return
    }
    try {
      removeMember(memberId)
      try {
        cyberAudio.click()
      } catch {}
      showToastSuccess(
        isTr ? 'Üye Çıkarıldı' : 'Member Removed',
        isTr ? `${memberName} takımdan ayrıldı.` : `${memberName} removed from team.`
      )
    } catch (err: any) {
      showToastError(isTr ? 'Hata' : 'Error', err.message)
    }
  }

  const getRoleBadge = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return {
          icon: <Crown className="w-3 h-3 text-amber-400" />,
          label: isTr ? 'SAHİP' : 'OWNER',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300'
        }
      case 'admin':
        return {
          icon: <Shield className="w-3 h-3 text-nexus-cyan" />,
          label: isTr ? 'YÖNETİCİ' : 'ADMIN',
          bg: 'bg-nexus-cyan/15 border-nexus-cyan/30 text-nexus-cyan'
        }
      case 'member':
        return {
          icon: <User className="w-3 h-3 text-purple-400" />,
          label: isTr ? 'ÜYE' : 'MEMBER',
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-300'
        }
      case 'viewer':
        return {
          icon: <Eye className="w-3 h-3 text-nexus-muted" />,
          label: isTr ? 'İZLEYİCİ' : 'VIEWER',
          bg: 'bg-white/5 border-white/10 text-nexus-muted'
        }
    }
  }

  if (!isOpen) return null

  const seatPercent = Math.min(100, Math.round((members.length / session.organization.maxSeats) * 100))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-nexus-surface/95 border border-nexus-border/60 shadow-2xl overflow-hidden backdrop-blur-2xl z-10 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-nexus-border/40 bg-nexus-bg/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-nexus-cyan/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/15">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{session.organization.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    TEAM RBAC
                  </span>
                </h2>
                <p className="text-xs text-nexus-muted mt-0.5">
                  {isTr
                    ? 'Takım kimliği, üye davetleri ve rol tabanlı yetkilendirme matrisi'
                    : 'Team identity, member invitations, and role-based access control matrix'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-nexus-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Seat Quota Bar */}
          <div className="px-6 py-2.5 bg-black/30 border-b border-nexus-border/20 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-nexus-muted">Koltuk Kullanımı (Seats):</span>
              <span className="text-white font-bold">
                {members.length} / {session.organization.maxSeats}
              </span>
            </div>
            <div className="w-40 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-nexus-cyan to-purple-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${seatPercent}%` }}
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-nexus-border/20 bg-nexus-bg/40">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'members'
                  ? 'border-nexus-cyan text-nexus-cyan bg-nexus-cyan/10'
                  : 'border-transparent text-nexus-muted hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isTr ? 'Takım Üyeleri' : 'Team Members'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
                {members.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'permissions'
                  ? 'border-nexus-cyan text-nexus-cyan bg-nexus-cyan/10'
                  : 'border-transparent text-nexus-muted hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isTr ? 'Rol & İzin Matrisi (RBAC)' : 'Role & Permissions Matrix'}</span>
            </button>

            <button
              onClick={() => setActiveTab('sso')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'sso'
                  ? 'border-nexus-cyan text-nexus-cyan bg-nexus-cyan/10'
                  : 'border-transparent text-nexus-muted hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{isTr ? 'Kurumsal SSO & Giriş' : 'Enterprise SSO'}</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: MEMBERS */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {isTr ? 'Aktif Mühendislik Ekibi' : 'Active Engineering Team'}
                    </h3>
                    <p className="text-[11px] text-nexus-muted">
                      {isTr
                        ? 'Takım üyelerinizin API ortamlarına ve koleksiyonlara erişim düzeylerini yönetin.'
                        : 'Manage team member access levels to shared API collections and environments.'}
                    </p>
                  </div>

                  {canManageMembers && (
                    <button
                      onClick={() => setIsInviting(!isInviting)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-purple-500/15"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isTr ? 'Yeni Üye Davet Et' : 'Invite Teammate'}</span>
                    </button>
                  )}
                </div>

                {/* Invite Form */}
                {isInviting && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={handleSendInvite}
                    className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="email"
                        required
                        placeholder={isTr ? 'muhendis@sirket.com' : 'engineer@company.com'}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-nexus-bg border border-nexus-border text-xs text-white placeholder-nexus-muted focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder={isTr ? 'Ad Soyad (Opsiyonel)' : 'Full Name (Optional)'}
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-nexus-bg border border-nexus-border text-xs text-white placeholder-nexus-muted focus:border-purple-500 focus:outline-none"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                        className="px-3 py-2 rounded-xl bg-nexus-bg border border-nexus-border text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
                      >
                        <option value="admin">Admin (Yönetici)</option>
                        <option value="member">Member (Geliştirici)</option>
                        <option value="viewer">Viewer (İzleyici)</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsInviting(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-nexus-muted hover:text-white"
                      >
                        {isTr ? 'İptal' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={!inviteEmail.trim()}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-nexus-cyan text-black font-bold text-xs disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {isTr ? 'Davet Gönder' : 'Send Invite'}
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Members List */}
                <div className="space-y-2">
                  {members.map((member) => {
                    const badge = getRoleBadge(member.role)
                    const isCurrentUser = member.email === session.user.email

                    return (
                      <div
                        key={member.id}
                        className="p-3.5 rounded-2xl bg-nexus-bg/50 border border-nexus-border/30 hover:border-nexus-border/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-nexus-cyan/20 border border-nexus-cyan/30 flex items-center justify-center font-bold text-nexus-cyan text-xs shrink-0">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{member.name}</span>
                              {isCurrentUser && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-nexus-cyan/20 text-nexus-cyan border border-nexus-cyan/40">
                                  {isTr ? 'SEN' : 'YOU'}
                                </span>
                              )}
                              {member.status === 'invited' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {isTr ? 'DAVET EDİLDİ' : 'INVITED'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-nexus-muted font-mono">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Role Selector or Badge */}
                          {canManageMembers && member.role !== 'owner' ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                              className={`text-[10px] font-mono font-bold px-2 py-1 rounded-xl border cursor-pointer focus:outline-none ${badge.bg}`}
                            >
                              <option value="admin">ADMIN</option>
                              <option value="member">MEMBER</option>
                              <option value="viewer">VIEWER</option>
                            </select>
                          ) : (
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${badge.bg}`}>
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>
                          )}

                          {/* Remove button */}
                          {canManageMembers && member.role !== 'owner' && !isCurrentUser && (
                            <button
                              onClick={() => handleRemove(member.id, member.name)}
                              className="p-1.5 rounded-lg text-nexus-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title={isTr ? 'Üyeyi Çıkar' : 'Remove Member'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: RBAC PERMISSION MATRIX */}
            {activeTab === 'permissions' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-nexus-border/30">
                  <h4 className="text-xs font-bold text-white mb-1">
                    {isTr ? 'Rol Tabanlı Yetkilendirme Politikası (RBAC Policy)' : 'Role-Based Access Control Policy'}
                  </h4>
                  <p className="text-[11px] text-nexus-muted leading-relaxed">
                    {isTr
                      ? 'Kurumsal güvenlik standartlarına uygun olarak takım rolleri belirli eylemlerle sınırlandırılmıştır. Hassas API anahtarlarını yalnızca Yöneticiler açık metin olarak görebilir.'
                      : 'Roles define actions within shared collections and workspaces. Secret environment variables are masked for non-admin teammates.'}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-nexus-border/40">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-nexus-border/40 bg-nexus-bg/80 text-nexus-muted">
                        <th className="p-3 text-[11px]">Yetki (Permission)</th>
                        <th className="p-3 text-center text-amber-400">OWNER</th>
                        <th className="p-3 text-center text-nexus-cyan">ADMIN</th>
                        <th className="p-3 text-center text-purple-300">MEMBER</th>
                        <th className="p-3 text-center text-nexus-muted">VIEWER</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px]">
                      {(
                        [
                          { perm: 'workspace:manage', label: 'Çalışma Alanı Silme / Faturalandırma' },
                          { perm: 'members:manage', label: 'Üye Davet Etme & Rol Değiştirme' },
                          { perm: 'collections:write', label: 'API İstekleri ve Koleksiyon Düzenleme' },
                          { perm: 'collections:read', label: 'API İsteklerini Çalıştırma & İnceleme' },
                          { perm: 'environments:reveal_secrets', label: 'Gizli Token & Parolaları Açık Görme' },
                          { perm: 'sync:publish', label: 'Buluta Değişiklik Yayınlama (E2EE Push)' }
                        ] as { perm: Permission; label: string }[]
                      ).map((row) => (
                        <tr key={row.perm} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white font-sans">{row.label}</td>
                          <td className="p-3 text-center">
                            {ROLE_PERMISSIONS.owner.includes(row.perm) ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-nexus-muted">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {ROLE_PERMISSIONS.admin.includes(row.perm) ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-nexus-muted">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {ROLE_PERMISSIONS.member.includes(row.perm) ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-nexus-muted">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {ROLE_PERMISSIONS.viewer.includes(row.perm) ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-nexus-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: ENTERPRISE SSO */}
            {activeTab === 'sso' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-nexus-border/30">
                  <h4 className="text-xs font-bold text-white mb-1">
                    {isTr ? 'Kurumsal Kimlik Doğrulama (Enterprise SSO)' : 'Enterprise Single Sign-On'}
                  </h4>
                  <p className="text-[11px] text-nexus-muted leading-relaxed">
                    {isTr
                      ? 'Takımınızın GitHub Organization, Google Workspace veya Okta SAML 2.0 dizini üzerinden tek tıkla güvenli oturum açmasını sağlayın.'
                      : 'Authenticate developers seamlessly via GitHub Organization, Google Workspace, or Okta SAML 2.0.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-nexus-bg/50 border border-nexus-border/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">GitHub OAuth</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          AKTİF
                        </span>
                      </div>
                      <p className="text-[11px] text-nexus-muted">
                        Mevcut oturum: <code className="text-nexus-cyan font-mono">{session.user.email}</code>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        login('github')
                        showToastSuccess('SSO', 'GitHub oturumu yenilendi.')
                      }}
                      className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
                    >
                      Oturumu Yenile
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-nexus-bg/50 border border-nexus-border/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">Google Workspace</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-nexus-muted">
                          HAZIR
                        </span>
                      </div>
                      <p className="text-[11px] text-nexus-muted">
                        Şirket e-posta alan adınızla (@zerdev.app) doğrudan giriş yapın.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        login('google')
                        showToastSuccess('Google SSO', 'Google Workspace hesabı bağlandı.')
                      }}
                      className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
                    >
                      Google ile Bağla
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-nexus-bg/50 border border-nexus-border/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">Okta / SAML 2.0</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          ENTERPRISE
                        </span>
                      </div>
                      <p className="text-[11px] text-nexus-muted">
                        Kurumsal kimlik sağlayıcınız ile merkezi SCIM üye yönetimi.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        login('sso_okta')
                        showToastSuccess('Okta SAML', 'Okta SAML 2.0 konfigürasyonu doğrulandı.')
                      }}
                      className="mt-4 w-full py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition cursor-pointer"
                    >
                      Okta Yapılandır
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
