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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { PasswordInput } from '../../components/password-input';

export default function ProfileScreen() {
  const {
    workspace,
    displayName,
    isOwner,
    members,
    addMember,
    updateDisplayName,
    deleteMember,
    refreshMembers,
    leaveWorkspace,
  } = useWorkspace();
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

  useEffect(() => {
    setEditNameInput(displayName);
  }, [displayName]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await leaveWorkspace();
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const handleSaveName = async () => {
    const name = editNameInput.trim();
    if (!name) {
      Alert.alert('Invalid Name', 'Please enter your name.');
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
      setShowEditName(false);
      Alert.alert('Updated', 'Your name has been saved.');
    } else {
      Alert.alert('Could Not Update', result.error ?? 'Please try again.');
    }
  };

  const handleDeleteMember = (memberId: string, name: string) => {
    Alert.alert('Remove Member', `Remove ${name} from this workspace?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(memberId);
          const result = await deleteMember(memberId);
          setDeletingId(null);
          if (result.ok) {
            Alert.alert('Removed', `${name} has been removed.`);
          } else {
            Alert.alert('Error', result.error ?? 'Could not remove member.');
          }
        },
      },
    ]);
  };

  const handleAddMember = async () => {
    const name = memberName.trim();
    const pass = memberPassword.trim();

    if (!name || !pass) {
      Alert.alert('Missing Fields', 'Enter member name and password.');
      return;
    }

    setAdding(true);
    const result = await addMember(name, pass);
    setAdding(false);

    if (result.ok) {
      setMemberName('');
      setMemberPassword('');
      setShowAddMember(false);
      Alert.alert(
        'Member Added',
        `${name} can login with workspace name ${workspace?.name}, their name, and password.`
      );
    } else {
      Alert.alert('Could Not Add Member', result.error ?? 'Please try again.');
    }
  };

  const workspaceLabel = workspace?.name ?? workspace?.id ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Profile Header */}
        <View style={styles.headerCard}>
          <View style={[styles.avatarContainer, { borderColor: isOwner ? '#F59E0B' : '#3B82F6' }]}>
            <Text style={styles.avatarText}>
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.nameText}>{displayName}</Text>

          <TouchableOpacity
            style={styles.editNameBtn}
            onPress={() => {
              setEditNameInput(displayName);
              setShowEditName(true);
            }}
          >
            <Ionicons name="pencil" size={16} color="#10B981" />
            <Text style={styles.editNameBtnText}>Edit name</Text>
          </TouchableOpacity>

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

        {/* Workspace Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Workspace Details</Text>

          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: '#1A2E24' }]}>
              <MaterialIcons name="workspaces" size={20} color="#10B981" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Workspace Name</Text>
              <Text style={styles.infoValue}>{workspaceLabel}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: '#1F1A2E' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Your Role</Text>
              <Text style={[styles.infoValue, { color: isOwner ? '#F59E0B' : '#3B82F6' }]}>
                {isOwner ? '👑 Owner' : '👤 Member'}
              </Text>
            </View>
          </View>
        </View>

        {/* Owner: Add Member */}
        {isOwner && (
          <>
            <TouchableOpacity
              style={styles.addMemberCard}
              onPress={() => setShowAddMember(true)}
              activeOpacity={0.85}
            >
              <View style={styles.addMemberIconWrap}>
                <Ionicons name="person-add" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.addMemberTextWrap}>
                <Text style={styles.addMemberTitle}>Add Member</Text>
                <Text style={styles.addMemberSubtitle}>
                  Share workspace name + member login details
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#6EE7B7" />
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Team Members {members.length > 0 ? `(${members.length})` : ''}
              </Text>

              {members.length === 0 ? (
                <Text style={styles.emptyMembers}>
                  No members yet. Tap Add Member above to let others join your workspace.
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
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  editNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0D3326',
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 12,
  },
  editNameBtnText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  ownerBadge: {
    backgroundColor: '#2A1F00',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  memberBadge: {
    backgroundColor: '#0D1B2E',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    marginTop: 10,
  },
  infoIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D3326',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 14,
  },
  addMemberIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMemberTextWrap: {
    flex: 1,
  },
  addMemberTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  addMemberSubtitle: {
    fontSize: 12,
    color: '#6EE7B7',
  },
  emptyMembers: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A2E4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteMemberBtn: {
    padding: 8,
  },
  tipCardInline: {
    flexDirection: 'row',
    backgroundColor: '#1F1700',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3D2E00',
    gap: 8,
    alignItems: 'flex-start',
  },
  tipTextInline: {
    flex: 1,
    fontSize: 12,
    color: '#D97706',
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#1A0A0A',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalHighlight: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 16,
  },
  modalPasswordWrap: {
    marginBottom: 16,
  },
  modalPasswordInput: {
    backgroundColor: 'transparent',
  },
  modalSubmitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
