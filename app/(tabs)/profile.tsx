import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useExpenses } from '../../hooks/useExpenses';
import { useAlert } from '../../context/AlertContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PasswordInput } from '../../components/password-input';

export default function ProfileScreen() {
  const {
    workspace,
    displayName,
    isOwner,
    members,
    addMember,
    updateDisplayName,
    updatePassword,
    deleteMember,
    deleteWorkspace,
    refreshMembers,
    leaveWorkspace,
  } = useWorkspace();
  const { refreshExpenses } = useExpenses();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (isOwner) refreshMembers();
    }, [isOwner, refreshMembers])
  );

  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [editNameInput, setEditNameInput] = useState(displayName);
  const [adding, setAdding] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);

  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    setEditNameInput(displayName);
  }, [displayName]);

  const handleLogout = () => {
    showConfirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      onConfirm: async () => {
        await leaveWorkspace();
        router.replace('/welcome');
      }
    });
  };

  const handleDeleteWorkspace = () => {
    showConfirm({
      title: 'Delete Workspace',
      message: 'Are you absolutely sure? This will permanently delete the workspace, all members, budgets, and expenses. This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: async () => {
        setDeletingWorkspace(true);
        const result = await deleteWorkspace();
        setDeletingWorkspace(false);
        if (result.ok) {
          router.replace('/welcome');
        } else {
          showAlert('Error', result.error ?? 'Could not delete workspace.');
        }
      }
    });
  };

  const handleSaveName = async () => {
    const name = editNameInput.trim();
    if (!name) {
      showAlert('Invalid Name', 'Please enter your name.');
      return;
    }
    if (name === displayName) {
      setShowEditName(false);
      return;
    }
    setSavingName(true);
    const result = await updateDisplayName(name);
    setSavingName(false);
    if (result.ok) {
      await refreshExpenses();
      setShowEditName(false);
      showAlert('Updated', 'Your name has been saved.');
    } else {
      showAlert('Could Not Update', result.error ?? 'Please try again.');
    }
  };

  const handleSavePassword = async () => {
    const pass = newPassword.trim();
    if (!pass) {
      showAlert('Invalid Password', 'Please enter a new password.');
      return;
    }
    setSavingPassword(true);
    const result = await updatePassword(pass);
    setSavingPassword(false);
    if (result.ok) {
      setShowResetPassword(false);
      setNewPassword('');
      showAlert('Updated', 'Your password has been changed.');
    } else {
      showAlert('Error', result.error ?? 'Please try again.');
    }
  };

  const handleDeleteMember = (memberId: string, name: string) => {
    showConfirm({
      title: 'Remove Member',
      message: `Are you sure you want to remove ${name} from this workspace?`,
      confirmText: 'Remove',
      onConfirm: async () => {
        setDeletingId(memberId);
        const result = await deleteMember(memberId);
        setDeletingId(null);
        if (result.ok) {
          showAlert('Removed', `${name} has been removed.`);
        } else {
          showAlert('Error', result.error ?? 'Could not remove member.');
        }
      }
    });
  };

  const handleAddMember = async () => {
    const name = memberName.trim();
    const pass = memberPassword.trim();

    if (!name || !pass) {
      showAlert('Missing Fields', 'Enter member name and password.');
      return;
    }

    setAdding(true);
    const result = await addMember(name, pass);
    setAdding(false);

    if (result.ok) {
      setMemberName('');
      setMemberPassword('');
      setShowAddMember(false);
      showAlert(
        'Member Added',
        `${name} joined the workspace!`
      );
    } else {
      showAlert('Could Not Add Member', result.error ?? 'Please try again.');
    }
  };

  const workspaceLabel = workspace?.name ?? workspace?.id ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.headerCard}>
          <View style={[styles.avatarContainer, { borderColor: isOwner ? '#F59E0B' : '#3B82F6' }]}>
            <Text style={styles.avatarText}>
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{displayName}</Text>
            <TouchableOpacity onPress={() => { setEditNameInput(displayName); setShowEditName(true); }}>
              <Ionicons name="create-outline" size={22} color="#34D399" />
            </TouchableOpacity>
          </View>

          <View style={styles.workspaceSimpleInfo}>
            <Text style={styles.workspaceSimpleText}>Workspace: <Text style={{color: '#F8FAFC'}}>{workspaceLabel}</Text></Text>
            <View style={[styles.badge, isOwner ? styles.ownerBadge : styles.memberBadge]}>
              <Ionicons
                name={isOwner ? 'star' : 'person'}
                size={12}
                color={isOwner ? '#F59E0B' : '#3B82F6'}
              />
              <Text style={[styles.badgeText, { color: isOwner ? '#F59E0B' : '#3B82F6' }]}>
                {isOwner ? 'Owner' : 'Member'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.resetPasswordBtn} onPress={() => setShowResetPassword(true)}>
            <Ionicons name="key-outline" size={16} color="#A78BFA" />
            <Text style={styles.resetPasswordText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Owner: Add Member */}
        {isOwner && (
          <>
            <View style={styles.card}>
              <View style={styles.teamHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Team Members {members.length > 0 ? `(${members.length})` : ''}
                </Text>
                <TouchableOpacity onPress={() => setShowAddMember(true)} style={styles.addMemberSmallBtn}>
                  <Ionicons name="person-add" size={14} color="#10B981" />
                  <Text style={styles.addMemberSmallBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {members.length === 0 ? (
                <Text style={styles.emptyMembers}>
                  No members yet. Tap Add above to let others join your workspace.
                </Text>
              ) : (
                members.map((m) => (
                  <View key={m.id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {m.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <TouchableOpacity
                      style={styles.deleteMemberBtn}
                      onPress={() => handleDeleteMember(m.id, m.name)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <View style={styles.tipCardInline}>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
                <Text style={styles.tipTextInline}>
                  Members login with workspace name ({workspaceLabel}), their name, and password.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FECACA" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Workspace Button */}
        {isOwner && (
          <TouchableOpacity 
            style={styles.deleteWorkspaceBtn} 
            onPress={handleDeleteWorkspace}
            disabled={deletingWorkspace}
          >
            {deletingWorkspace ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                <Text style={styles.deleteWorkspaceBtnText}>Delete Workspace</Text>
              </>
            )}
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showEditName} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Your Name</Text>
              <TouchableOpacity onPress={() => setShowEditName(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              This updates your display name{isOwner ? ' as workspace owner' : ''} for login and expenses.
            </Text>

            <Text style={styles.inputLabel}>YOUR NAME</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your name"
              placeholderTextColor="#555"
              value={editNameInput}
              onChangeText={setEditNameInput}
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, savingName && styles.btnDisabled]}
              onPress={handleSaveName}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitText}>Save Name</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={showAddMember} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Member</Text>
              <TouchableOpacity onPress={() => setShowAddMember(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Set a name and password. They login with workspace name{' '}
              <Text style={styles.modalHighlight}>{workspaceLabel}</Text>, their name, and this password.
            </Text>

            <Text style={styles.inputLabel}>MEMBER NAME</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Rahul"
              placeholderTextColor="#555"
              value={memberName}
              onChangeText={setMemberName}
            />

            <Text style={styles.inputLabel}>MEMBER PASSWORD</Text>
            <PasswordInput
              containerStyle={styles.modalPasswordWrap}
              inputStyle={styles.modalPasswordInput}
              placeholder="Password for this member"
              placeholderTextColor="#555"
              value={memberPassword}
              onChangeText={setMemberPassword}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, adding && styles.btnDisabled]}
              onPress={handleAddMember}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitText}>Add Member</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showResetPassword} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowResetPassword(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Update the password used to log into this workspace account.
            </Text>

            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <PasswordInput
              containerStyle={styles.modalPasswordWrap}
              inputStyle={styles.modalPasswordInput}
              placeholder="Enter new password"
              placeholderTextColor="#555"
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, savingPassword && styles.btnDisabled]}
              onPress={handleSavePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSubmitText}>Save Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deeper, modern dark blue/slate background
  },
  screenHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: '#1E293B', // Rich slate card
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  workspaceSimpleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workspaceSimpleText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  resetPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginTop: 16,
  },
  resetPasswordText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
  },
  ownerBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  memberBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMemberSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  addMemberSmallBtnText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  infoIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  addMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 16,
  },
  addMemberIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addMemberTextWrap: {
    flex: 1,
  },
  addMemberTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  addMemberSubtitle: {
    fontSize: 13,
    color: '#A7F3D0',
    lineHeight: 18,
  },
  emptyMembers: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 14,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  memberAvatarText: {
    color: '#60A5FA',
    fontWeight: '800',
    fontSize: 18,
  },
  memberName: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteMemberBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
  },
  tipCardInline: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipTextInline: {
    flex: 1,
    fontSize: 13,
    color: '#FCD34D',
    lineHeight: 20,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#4A1515',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    gap: 8,
  },
  logoutText: {
    color: '#FECACA',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteWorkspaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteWorkspaceBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalHighlight: {
    color: '#34D399',
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 20,
  },
  modalPasswordWrap: {
    marginBottom: 20,
  },
  modalPasswordInput: {
    backgroundColor: 'transparent',
  },
  modalSubmitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
});
