'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace, UserRole } from '@/types';

interface AuthContextType {
  workspace: Workspace;
  currentUser: User;
  switchWorkspace: (workspaceId: string) => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  availableWorkspaces: Workspace[];
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

const allUsers: User[] = [
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
  {
    id: 'usr-isolated',
    workspaceId: 'ws-summit-202',
    name: 'Tom Bradley',
    email: 't.bradley@summitcoast.com',
    role: 'ADMIN',
    active: true,
    createdAt: '2026-01-01T09:00:00Z',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(defaultWorkspaces[0]);
  const [currentUser, setCurrentUser] = useState<User>(allUsers[0]);

  // Load from localStorage if present on client
  useEffect(() => {
    const savedWs = localStorage.getItem('ml_workspace_id');
    const savedUsr = localStorage.getItem('ml_user_id');

    if (savedWs) {
      const found = defaultWorkspaces.find((w) => w.id === savedWs);
      if (found) setWorkspace(found);
    }
    if (savedUsr) {
      const found = allUsers.find((u) => u.id === savedUsr);
      if (found) setCurrentUser(found);
    }
  }, []);

  const switchWorkspace = (workspaceId: string) => {
    const foundWs = defaultWorkspaces.find((w) => w.id === workspaceId) || defaultWorkspaces[0];
    setWorkspace(foundWs);
    localStorage.setItem('ml_workspace_id', foundWs.id);

    // Pick a user matching this workspace
    const userInWs = allUsers.find((u) => u.workspaceId === foundWs.id) || allUsers[0];
    setCurrentUser(userInWs);
    localStorage.setItem('ml_user_id', userInWs.id);
  };

  const switchUser = (userId: string) => {
    const foundUser = allUsers.find((u) => u.id === userId);
    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('ml_user_id', foundUser.id);
    }
  };

  const availableUsers = allUsers.filter((u) => u.workspaceId === workspace.id);

  return (
    <AuthContext.Provider
      value={{
        workspace,
        currentUser,
        switchWorkspace,
        switchUser,
        availableUsers,
        availableWorkspaces: defaultWorkspaces,
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
