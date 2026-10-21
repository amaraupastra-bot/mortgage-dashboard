'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Workspace, UserRole } from '@/types';

interface AuthContextType {
  workspace: Workspace;
  currentUser: User;
  switchWorkspace: (workspaceId: string) => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  availableWorkspaces: Workspace[];
  login: (email: string, password?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  acceptInvite: (params: {
    token: string;
    name: string;
    email: string;
    role: UserRole;
    password?: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  refreshUsers: () => Promise<void>;
}

const defaultWorkspaces: Workspace[] = [
  {
    id: 'ws-apex-101',
    name: 'Apex Lending Partners',
    nmlsId: '1948201',
    contactEmail: 'operations@apexlending.com',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ws-summit-202',
    name: 'Summit Coast Mortgage',
    nmlsId: '2084912',
    contactEmail: 'admin@summitcoast.com',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const fallbackUsers: User[] = [
  {
    id: 'usr-1',
    workspaceId: 'ws-apex-101',
    name: 'Sarah Jenkins',
    email: 's.jenkins@apexlending.com',
    role: 'ADMIN',
    active: true,
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'usr-2',
    workspaceId: 'ws-apex-101',
    name: 'David Miller',
    email: 'd.miller@apexlending.com',
    role: 'LOAN_OFFICER',
    active: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'usr-3',
    workspaceId: 'ws-apex-101',
    name: 'Elena Ramos',
    email: 'e.ramos@apexlending.com',
    role: 'PROCESSOR',
    active: true,
    createdAt: '2026-02-01T08:30:00Z',
  },
  {
    id: 'usr-4',
    workspaceId: 'ws-apex-101',
    name: 'Marcus Vance',
    email: 'm.vance@apexlending.com',
    role: 'LOAN_OFFICER',
    active: true,
    createdAt: '2026-02-10T11:15:00Z',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(defaultWorkspaces[0]);
  const [currentUser, setCurrentUser] = useState<User>(fallbackUsers[0]);
  const [userList, setUserList] = useState<User[]>(fallbackUsers);

  // Sync users from DB for the active workspace
  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/team?workspaceId=${workspace.id}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setUserList(json.data);
      }
    } catch {
      // Fallback stays in place
    }
  }, [workspace.id]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Load saved session on mount
  useEffect(() => {
    const savedWs = localStorage.getItem('ml_workspace_id');
    const savedUsr = localStorage.getItem('ml_user_id');

    if (savedWs) {
      const found = defaultWorkspaces.find((w) => w.id === savedWs);
      if (found) setWorkspace(found);
    }
    if (savedUsr) {
      const found = userList.find((u) => u.id === savedUsr) || fallbackUsers.find((u) => u.id === savedUsr);
      if (found) setCurrentUser(found);
    }
  }, [userList]);

  const switchWorkspace = (workspaceId: string) => {
    const foundWs = defaultWorkspaces.find((w) => w.id === workspaceId) || defaultWorkspaces[0];
    setWorkspace(foundWs);
    localStorage.setItem('ml_workspace_id', foundWs.id);

    // Pick a user matching this workspace
    const userInWs = userList.find((u) => u.workspaceId === foundWs.id) || fallbackUsers[0];
    setCurrentUser(userInWs);
    localStorage.setItem('ml_user_id', userInWs.id);
  };

  const switchUser = (userId: string) => {
    const foundUser = userList.find((u) => u.id === userId) || fallbackUsers.find((u) => u.id === userId);
    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('ml_user_id', foundUser.id);
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
          workspaceId: workspace.id,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error || 'Authentication failed' };
      }

      const user = json.data as User;
      setCurrentUser(user);
      localStorage.setItem('ml_user_id', user.id);
      await refreshUsers();
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during sign in' };
    }
  };

  const acceptInvite = async (params: {
    token: string;
    name: string;
    email: string;
    role: UserRole;
    password?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept-invite',
          ...params,
          workspaceId: workspace.id,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error || 'Failed to accept invitation' };
      }

      const user = json.data as User;
      setCurrentUser(user);
      localStorage.setItem('ml_user_id', user.id);
      await refreshUsers();
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during invite acceptance' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ml_user_id');
    // Switch to Sarah Jenkins or redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        workspace,
        currentUser,
        switchWorkspace,
        switchUser,
        availableUsers: userList,
        availableWorkspaces: defaultWorkspaces,
        login,
        logout,
        acceptInvite,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
