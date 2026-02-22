import React, { useState } from 'react';
import { RoleBadge } from '../components/RoleBadge';
import { Switch } from '../components/ui/switch';
import { Check, X, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'analyst' | 'auditor' | 'admin';
  department: string;
  piiMasking: boolean;
  status: 'active' | 'inactive';
}

interface Permission {
  id: string;
  label: string;
  analyst: boolean;
  auditor: boolean;
  admin: boolean;
}

interface ConfirmationModalData {
  show: boolean;
  type: 'permission' | 'pii' | null;
  userId?: string;
  userName?: string;
  permissionId?: string;
  permissionLabel?: string;
  role?: 'analyst' | 'auditor' | 'admin';
  currentValue?: boolean;
}

const initialUsers: User[] = [
  {
    id: 'U12345',
    name: 'John Doe',
    email: 'john.doe@bank.com',
    role: 'analyst',
    department: 'Risk Management',
    piiMasking: true,
    status: 'active',
  },
  {
    id: 'U12346',
    name: 'Sarah Smith',
    email: 'sarah.smith@bank.com',
    role: 'auditor',
    department: 'Compliance',
    piiMasking: true,
    status: 'active',
  },
  {
    id: 'U12347',
    name: 'Michael Chen',
    email: 'michael.chen@bank.com',
    role: 'analyst',
    department: 'Fraud Detection',
    piiMasking: true,
    status: 'active',
  },
  {
    id: 'U12348',
    name: 'Jane Wilson',
    email: 'jane.wilson@bank.com',
    role: 'analyst',
    department: 'Risk Management',
    piiMasking: true,
    status: 'active',
  },
  {
    id: 'U12349',
    name: 'Robert Brown',
    email: 'robert.brown@bank.com',
    role: 'admin',
    department: 'IT Security',
    piiMasking: false,
    status: 'active',
  },
];

const initialPermissions: Permission[] = [
  { id: 'view_transactions', label: 'View Transactions', analyst: true, auditor: true, admin: true },
  { id: 'export_data', label: 'Export Data', analyst: true, auditor: true, admin: true },
  { id: 'run_queries', label: 'Run Custom Queries', analyst: true, auditor: false, admin: true },
  { id: 'view_fraud', label: 'View Fraud Intelligence', analyst: true, auditor: true, admin: true },
  { id: 'modify_risk_rules', label: 'Modify Risk Rules', analyst: false, auditor: false, admin: true },
  { id: 'view_audit_logs', label: 'View Audit Logs', analyst: false, auditor: true, admin: true },
  { id: 'manage_users', label: 'Manage Users & RBAC', analyst: false, auditor: false, admin: true },
  { id: 'unmask_pii', label: 'Unmask PII Data', analyst: false, auditor: true, admin: true },
];

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalData>({
    show: false,
    type: null,
  });

  const handlePermissionToggle = (permissionId: string, role: 'analyst' | 'auditor' | 'admin') => {
    const permission = permissions.find((p) => p.id === permissionId);
    if (!permission) return;

    setConfirmationModal({
      show: true,
      type: 'permission',
      permissionId,
      permissionLabel: permission.label,
      role,
      currentValue: permission[role],
    });
  };

  const handlePIIMaskingToggle = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setConfirmationModal({
      show: true,
      type: 'pii',
      userId,
      userName: user.name,
      currentValue: user.piiMasking,
    });
  };

  const confirmPermissionChange = () => {
    if (confirmationModal.type === 'permission' && confirmationModal.permissionId && confirmationModal.role) {
      setPermissions((prev) =>
        prev.map((p) =>
          p.id === confirmationModal.permissionId
            ? { ...p, [confirmationModal.role]: !confirmationModal.currentValue }
            : p
        )
      );
    } else if (confirmationModal.type === 'pii' && confirmationModal.userId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === confirmationModal.userId ? { ...u, piiMasking: !confirmationModal.currentValue } : u
        )
      );
    }
    setConfirmationModal({ show: false, type: null });
  };

  const cancelConfirmation = () => {
    setConfirmationModal({ show: false, type: null });
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-[28px] font-semibold text-foreground mb-1">Admin / RBAC</h1>
        <p className="text-[14px] text-muted-foreground">
          Manage user permissions and role-based access controls
        </p>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-card border border-border">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <h2 className="text-[16px] font-medium text-foreground">Role-Based Permissions Matrix</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            Configure permissions for each role across the platform
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Permission
                </th>
                <th className="px-5 py-3 text-center text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Analyst
                </th>
                <th className="px-5 py-3 text-center text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Auditor
                </th>
                <th className="px-5 py-3 text-center text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {permissions.map((permission) => (
                <tr key={permission.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 text-[14px] text-foreground">{permission.label}</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={permission.analyst}
                        onCheckedChange={() => handlePermissionToggle(permission.id, 'analyst')}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={permission.auditor}
                        onCheckedChange={() => handlePermissionToggle(permission.id, 'auditor')}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={permission.admin}
                        onCheckedChange={() => handlePermissionToggle(permission.id, 'admin')}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-card border border-border">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <h2 className="text-[16px] font-medium text-foreground">User Management</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            Manage individual user accounts and PII masking settings
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  User ID
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Department
                </th>
                <th className="px-5 py-3 text-left text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Role
                </th>
                <th className="px-5 py-3 text-center text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  PII Masking
                </th>
                <th className="px-5 py-3 text-center text-[12px] font-semibold text-foreground uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-5 py-3 text-[13px] font-mono text-foreground">{user.id}</td>
                  <td className="px-5 py-3 text-[14px] text-foreground">{user.name}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{user.email}</td>
                  <td className="px-5 py-3 text-[13px] text-foreground">{user.department}</td>
                  <td className="px-5 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div
                      className="flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={user.piiMasking}
                        onCheckedChange={() => handlePIIMaskingToggle(user.id)}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 text-[12px] font-medium border ${user.status === 'active'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-muted text-muted-foreground border-border'
                        }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PII Masking Preview */}
      <div className="bg-card border border-border">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <h2 className="text-[16px] font-medium text-foreground">PII Masking Preview</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            Example of how PII data appears when masking is enabled or disabled
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-[13px] font-medium text-foreground mb-3">Masking Enabled</h3>
              <div className="space-y-2 text-[13px] bg-muted/20 p-4 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-mono text-foreground">****7823</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground">j***@bank.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SSN:</span>
                  <span className="font-mono text-foreground">***-**-1234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono text-foreground">***.***.*.***</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-medium text-foreground mb-3">Masking Disabled</h3>
              <div className="space-y-2 text-[13px] bg-destructive/5 p-4 border border-destructive/30">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-mono text-foreground">4539-2341-8823-7823</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground">john.doe@bank.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SSN:</span>
                  <span className="font-mono text-foreground">123-45-1234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono text-foreground">192.168.1.45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border shadow-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-foreground">Confirm Permission Change</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    This action requires confirmation
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              {confirmationModal.type === 'permission' ? (
                <p className="text-[14px] text-foreground">
                  Are you sure you want to{' '}
                  <strong>{confirmationModal.currentValue ? 'revoke' : 'grant'}</strong> the{' '}
                  <strong>"{confirmationModal.permissionLabel}"</strong> permission for the{' '}
                  <strong>{confirmationModal.role}</strong> role?
                </p>
              ) : (
                <p className="text-[14px] text-foreground">
                  Are you sure you want to{' '}
                  <strong>{confirmationModal.currentValue ? 'disable' : 'enable'}</strong> PII masking for{' '}
                  <strong>{confirmationModal.userName}</strong>?
                </p>
              )}

              <div className="mt-4 p-3 bg-warning/10 border border-warning/30 text-[12px] text-foreground">
                <strong>Warning:</strong> This change will take effect immediately and will be logged in
                the audit system.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={cancelConfirmation}
                className="px-4 py-2 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPermissionChange}
                className="px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-[14px]"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
