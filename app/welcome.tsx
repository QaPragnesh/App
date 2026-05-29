import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useWorkspace, normalizeWorkspaceName } from '../context/WorkspaceContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordInput } from '../components/password-input';

type Mode = 'create' | 'login';

export default function WelcomeScreen() {
  const { createWorkspace, loginWorkspace } = useWorkspace();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('create');
  const [workspaceName, setWorkspaceName] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const resetFields = () => {
    setWorkspaceName('');
    setPassword('');
    setDisplayName('');
  };

  const handleCreate = async () => {
    const wsName = normalizeWorkspaceName(workspaceName);
    const pass = password.trim();
    const dName = displayName.trim();

    if (!wsName || !pass || !dName) {
      Alert.alert('Missing Fields', 'Workspace name, your name, and password are required.');
      return;
    }
    setLoading(true);
    const result = await createWorkspace(wsName, pass, dName);
    setLoading(false);
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', result.error ?? 'Could not create workspace.');
    }
  };

  const handleLogin = async () => {
    const wsName = normalizeWorkspaceName(workspaceName);
    const pass = password.trim();
    const dName = displayName.trim();

    if (!wsName || !pass || !dName) {
      Alert.alert('Missing Fields', 'Workspace name, your name, and password are required.');
      return;
    }
    setLoading(true);
    const result = await loginWorkspace(wsName, pass, dName);
    setLoading(false);
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', result.error ?? 'Please check your details and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="wallet" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Expense Tracker</Text>
            <Text style={styles.subtitle}>Manage finances together</Text>
          </View>

          {mode === 'create' ? (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Ionicons name="add-circle" size={22} color="#10B981" />
                <Text style={styles.formTitle}>Create Workspace</Text>
              </View>
              <Text style={styles.formSubtitle}>
                Choose a workspace name (uppercase). Share it with members after adding them in Profile.
              </Text>

              <Text style={styles.label}>YOUR NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Pragnesh"
                placeholderTextColor="#555"
                value={displayName}
                onChangeText={setDisplayName}
              />

              <Text style={styles.label}>WORKSPACE NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. FAMILY"
                placeholderTextColor="#555"
                autoCapitalize="characters"
                value={workspaceName}
                onChangeText={(t) => setWorkspaceName(t.toUpperCase())}
              />

              <Text style={styles.label}>PASSWORD</Text>
              <PasswordInput
                placeholder="Set your password"
                placeholderTextColor="#555"
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Creating...' : 'Create Workspace'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchBtn}
                onPress={() => { resetFields(); setMode('login'); }}
              >
                <Ionicons name="log-in-outline" size={18} color="#3B82F6" />
                <Text style={styles.switchBtnText}>Login to existing workspace</Text>
              </TouchableOpacity>
            </View>

          ) : (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Ionicons name="log-in" size={22} color="#3B82F6" />
                <Text style={[styles.formTitle, { color: '#3B82F6' }]}>Login</Text>
              </View>
              <Text style={styles.formSubtitle}>
                Enter workspace name, your name, and password.
              </Text>

              <Text style={styles.label}>WORKSPACE NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. FAMILY"
                placeholderTextColor="#555"
                autoCapitalize="characters"
                value={workspaceName}
                onChangeText={(t) => setWorkspaceName(t.toUpperCase())}
              />

              <Text style={styles.label}>YOUR NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul"
                placeholderTextColor="#555"
                value={displayName}
                onChangeText={setDisplayName}
              />

              <Text style={styles.label}>PASSWORD</Text>
              <PasswordInput
                placeholder="Your password"
                placeholderTextColor="#555"
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchBtn}
                onPress={() => { resetFields(); setMode('create'); }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#10B981" />
                <Text style={[styles.switchBtnText, { color: '#10B981' }]}>Create a new workspace</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A3A3A3',
  },
  formCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  formSubtitle: {
    fontSize: 13,
    color: '#737373',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
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
  primaryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  switchBtnText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});
