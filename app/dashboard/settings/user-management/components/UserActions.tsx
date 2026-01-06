// app/dashboard/settings/user-management/components/UserActions.tsx

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, UserCheck, UserX, Ban } from "lucide-react";

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: "super_admin" | "admin" | "inspector" | "user"; // ✅ UPDATED: Added inspector
  status?: "active" | "inactive" | "suspended";
}

interface UserActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onUpdateStatus: (user: User, status: "active" | "inactive" | "suspended") => void;
}

export function UserActions({ user, onEdit, onDelete, onUpdateStatus }: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserCheck className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => onUpdateStatus(user, "active")}
              disabled={user.status === "active"}
            >
              <UserCheck className="mr-2 h-4 w-4 text-green-600" />
              Set Active
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateStatus(user, "inactive")}
              disabled={user.status === "inactive"}
            >
              <UserX className="mr-2 h-4 w-4 text-yellow-600" />
              Set Inactive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateStatus(user, "suspended")}
              disabled={user.status === "suspended"}
            >
              <Ban className="mr-2 h-4 w-4 text-red-600" />
              Suspend
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => onDelete(user)}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}