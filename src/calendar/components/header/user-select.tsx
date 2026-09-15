import { useState } from "react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UserSelect() {
  const { users, selectedUserId, setSelectedUserId } = useCalendar();
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredUsers = users.filter(user => user.name.toLocaleLowerCase().includes(normalizedQuery));

  return (
    <Select
      value={selectedUserId ?? undefined}
      onValueChange={setSelectedUserId}
      onOpenChange={open => {
        if (!open) setSearchQuery("");
      }}
    >
      <SelectTrigger className="flex-1 md:w-48">
        <SelectValue placeholder="Search member" />
      </SelectTrigger>

      <SelectContent align="end">
        <input
          type="search"
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          onKeyDown={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
          placeholder="Search members"
          aria-label="Search members"
          className="mb-1 h-9 w-full rounded-sm border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        />

        {filteredUsers.map(user => (
          <SelectItem key={user.id} value={user.id} className="flex-1">
            <div className="flex items-center gap-2">
              <Avatar key={user.id} className="size-6">
                <AvatarImage src={user.picturePath ?? undefined} alt={user.name} />
                <AvatarFallback className="text-xxs">{user.name[0]}</AvatarFallback>
              </Avatar>

              <p className="truncate">{user.name}</p>
            </div>
          </SelectItem>
        ))}

        {filteredUsers.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">No members found</p>}
      </SelectContent>
    </Select>
  );
}
