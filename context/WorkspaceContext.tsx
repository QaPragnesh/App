import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type Workspace = {
  id: string;
  name: string; // always same as id (uppercase)
};

export type WorkspaceMember = {
  id: string;
  name: string;
  workspace_id: string;
};

/** Workspace ID is always uppercase (e.g. ABC12XYZ) */
export const normalizeWorkspaceId = (id: string) => id.trim().toUpperCase();

/** @deprecated use normalizeWorkspaceId */
export const normalizeWorkspaceName = normalizeWorkspaceId;

const isOwnerName = (ownerName: string | null | undefined, loginName: string) =>
  (ownerName ?? '').trim().toLowerCase() === loginName.trim().toLowerCase();

const findWorkspaceByName = (
  rows: { id: string; name?: string }[] | null,
  workspaceName: string
) => {
  const normalized = normalizeWorkspaceId(workspaceName);
  return rows?.find(
    (w) =>
      normalizeWorkspaceId(w.id) === normalized ||
      normalizeWorkspaceId(w.name ?? '') === normalized
  );
};

type WorkspaceContextType = {
  workspace: Workspace | null;
  displayName: string;
  isOwner: boolean;
  loading: boolean;
  members: WorkspaceMember[];
  createWorkspace: (
    workspaceName: string,
    password: string,
    displayName: string
  ) => Promise<{ ok: boolean; error?: string }>;
  loginWorkspace: (
    workspaceName: string,
    password: string,
    displayName: string
  ) => Promise<{ ok: boolean; error?: string }>;
  addMember: (memberName: string, memberPassword: string) => Promise<{ ok: boolean; error?: string }>;
  updateDisplayName: (newName: string) => Promise<{ ok: boolean; error?: string }>;
  deleteMember: (memberId: string) => Promise<{ ok: boolean; error?: string }>;
  refreshMembers: () => Promise<void>;
  leaveWorkspace: () => Promise<void>;
};

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const storedCode = await AsyncStorage.getItem('@workspace_code');
      const storedDisplayName = await AsyncStorage.getItem('@display_name');
      const storedIsOwner = await AsyncStorage.getItem('@is_owner');

      const storedName = await AsyncStorage.getItem('@workspace_name');

      if (storedCode && storedDisplayName) {
        const id = normalizeWorkspaceId(storedCode);
        const name = storedName ? normalizeWorkspaceId(storedName) : id;
        setWorkspace({ id, name });
        setDisplayName(storedDisplayName);
        setIsOwner(storedIsOwner === 'true');
      }
    } catch (e) {
      console.error('Error loading workspace from storage', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshMembers = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('id, name, workspace_id')
        .eq('workspace_id', workspace.id)
        .order('name');

      if (!error && data) {
        setMembers(data);
      }
    } catch (e) {
      console.error('Error loading members', e);
    }
  };

  useEffect(() => {
    if (workspace?.id && isOwner) {
      refreshMembers();
    } else {
      setMembers([]);
    }
  }, [workspace?.id, isOwner]);

  const addMember = async (
    memberName: string,
    memberPassword: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!workspace?.id || !isOwner) {
      return { ok: false, error: 'Only the workspace owner can add members.' };
    }

    const name = memberName.trim();
    const pass = memberPassword.trim();

    if (!name || !pass) {
      return { ok: false, error: 'Name and password are required.' };
    }

    try {
      const { error } = await supabase.from('workspace_members').insert([
        { workspace_id: workspace.id, name, password: pass },
      ]);

      if (error) {
        if (error.code === '23505') {
          return { ok: false, error: 'A member with this name already exists.' };
        }
        throw error;
      }

      await refreshMembers();
      return { ok: true };
    } catch (e: any) {
      console.error('Error adding member:', e?.message || e);
      return { ok: false, error: 'Could not add member. Please try again.' };
    }
  };

  const updateDisplayName = async (newName: string): Promise<{ ok: boolean; error?: string }> => {
    if (!workspace?.id) {
      return { ok: false, error: 'No workspace selected.' };
    }

    const trimmed = newName.trim();
    if (!trimmed) {
      return { ok: false, error: 'Name cannot be empty.' };
    }

    const previousName = displayName;

    try {
      if (isOwner) {
        const { error } = await supabase
          .from('workspaces')
          .update({ owner_name: trimmed })
          .eq('id', workspace.id);

        if (error) throw error;
      } else {
        const memberId = await AsyncStorage.getItem('@member_id');
        let error = null;

        if (memberId) {
          ({ error } = await supabase
            .from('workspace_members')
            .update({ name: trimmed })
            .eq('id', memberId)
            .eq('workspace_id', workspace.id));
        } else {
          ({ error } = await supabase
            .from('workspace_members')
            .update({ name: trimmed })
            .eq('workspace_id', workspace.id)
            .ilike('name', previousName));
        }

        if (error) throw error;
      }

      await AsyncStorage.setItem('@display_name', trimmed);
      setDisplayName(trimmed);
      return { ok: true };
    } catch (e: any) {
      console.error('Error updating name:', e?.message || e);
      return { ok: false, error: 'Could not update name. Please try again.' };
    }
  };

  const deleteMember = async (memberId: string): Promise<{ ok: boolean; error?: string }> => {
    if (!workspace?.id || !isOwner) {
      return { ok: false, error: 'Only the owner can remove members.' };
    }

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)
        .eq('workspace_id', workspace.id);

      if (error) throw error;

      await refreshMembers();
      return { ok: true };
    } catch (e: any) {
      console.error('Error deleting member:', e?.message || e);
      return { ok: false, error: 'Could not remove member.' };
    }
  };

  const createWorkspace = async (
    workspaceName: string,
    password: string,
    userDisplayName: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const name = normalizeWorkspaceId(workspaceName);
      const ownerName = userDisplayName.trim();
      const pass = password.trim();

      if (!name || !pass || !ownerName) {
        return { ok: false, error: 'Workspace name, your name, and password are required.' };
      }

      const { data: existing } = await supabase.from('workspaces').select('id').eq('id', name).maybeSingle();
      if (existing) {
        return { ok: false, error: 'This workspace name is already taken. Choose another.' };
      }

      const { error } = await supabase.from('workspaces').insert([
        { id: name, name, password: pass, owner_name: ownerName },
      ]);

      if (error) throw error;

      await AsyncStorage.setItem('@workspace_code', name);
      await AsyncStorage.setItem('@workspace_name', name);
      await AsyncStorage.setItem('@display_name', ownerName);
      await AsyncStorage.setItem('@is_owner', 'true');
      await AsyncStorage.removeItem('@member_id');

      setWorkspace({ id: name, name });
      setDisplayName(ownerName);
      setIsOwner(true);
      return { ok: true };
    } catch (e: any) {
      console.error('Error creating workspace:', e?.message || e);
      return { ok: false, error: 'Could not create workspace. Please try again.' };
    }
  };

  const loginWorkspace = async (
    workspaceName: string,
    password: string,
    userDisplayName: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const wsName = normalizeWorkspaceId(workspaceName);
      const loginName = userDisplayName.trim();
      const pass = password.trim();

      if (!wsName || !pass || !loginName) {
        return { ok: false, error: 'Workspace name, your name, and password are required.' };
      }

      const { data: workspaceRows, error: wsError } = await supabase.from('workspaces').select('*');

      if (wsError) {
        console.error('Workspace fetch error:', wsError.message);
        return { ok: false, error: 'Could not reach server. Check your connection.' };
      }

      const ws = findWorkspaceByName(workspaceRows, wsName);

      if (!ws) {
        return { ok: false, error: 'Workspace not found. Check the workspace name.' };
      }

      const id = normalizeWorkspaceId(ws.id);
      const name = normalizeWorkspaceId(ws.name ?? ws.id);
      const workspacePassword = (ws.password ?? '').trim();
      const ownerName = (ws.owner_name as string | null) ?? '';

      if (pass === workspacePassword && isOwnerName(ownerName, loginName)) {
        await AsyncStorage.setItem('@workspace_code', id);
        await AsyncStorage.setItem('@workspace_name', name);
        await AsyncStorage.setItem('@display_name', loginName);
        await AsyncStorage.setItem('@is_owner', 'true');
        await AsyncStorage.removeItem('@member_id');

        setWorkspace({ id, name });
        setDisplayName(loginName);
        setIsOwner(true);
        return { ok: true };
      }

      const { data: memberRows, error: memberError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', id);

      if (memberError) {
        console.error('Member fetch error:', memberError.message);
        if (memberError.code === '42P01' || memberError.message?.includes('workspace_members')) {
          return {
            ok: false,
            error: 'Members table missing. Run supabase/workspace_members.sql in Supabase.',
          };
        }
        return { ok: false, error: 'Could not verify member. Try again.' };
      }

      const member = memberRows?.find(
        (m) =>
          m.name.trim().toLowerCase() === loginName.toLowerCase() &&
          (m.password ?? '').trim() === pass
      );

      if (member) {
        await AsyncStorage.setItem('@workspace_code', id);
        await AsyncStorage.setItem('@workspace_name', name);
        await AsyncStorage.setItem('@display_name', member.name);
        await AsyncStorage.setItem('@is_owner', 'false');
        await AsyncStorage.setItem('@member_id', member.id);

        setWorkspace({ id, name });
        setDisplayName(member.name);
        setIsOwner(false);
        return { ok: true };
      }

      const nameExists = memberRows?.some(
        (m) => m.name.trim().toLowerCase() === loginName.toLowerCase()
      );
      if (nameExists) {
        return { ok: false, error: 'Wrong password.' };
      }

      if (isOwnerName(ownerName, loginName)) {
        return { ok: false, error: 'Wrong password for owner.' };
      }

      return {
        ok: false,
        error: 'Member not found. Ask the owner to add you in Profile → Add Member.',
      };
    } catch (e: any) {
      console.error('Error logging into workspace:', e?.message || e);
      return { ok: false, error: 'Login failed. Please try again.' };
    }
  };

  const leaveWorkspace = async () => {
    await AsyncStorage.removeItem('@workspace_code');
    await AsyncStorage.removeItem('@workspace_name');
    await AsyncStorage.removeItem('@display_name');
    await AsyncStorage.removeItem('@is_owner');
    await AsyncStorage.removeItem('@member_id');
    setWorkspace(null);
    setDisplayName('');
    setIsOwner(false);
    setMembers([]);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        displayName,
        isOwner,
        loading,
        members,
        createWorkspace,
        loginWorkspace,
        addMember,
        updateDisplayName,
        deleteMember,
        refreshMembers,
        leaveWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
