import { useState } from "react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function UserSelect() {
  const { users, selectedUserIds, setSelectedUserIds } = useCalendar();
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredUsers = users
    .filter(user => user.name.toLocaleLowerCase().includes(normalizedQuery))
    .sort((firstUser, secondUser) => Number(selectedUserIds.includes(secondUser.id)) - Number(selectedUserIds.includes(firstUser.id)));
  const selectedUserNames = users.filter(user => selectedUserIds.includes(user.id)).map(user => user.name);

  const toggleUser = (userId: string) => {
    setSelectedUserIds(selectedUserIds.includes(userId) ? selectedUserIds.filter(id => id !== userId) : [...selectedUserIds, userId]);
  };

  return (
    <Popover
      onOpenChange={open => {
        if (!open) setSearchQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex-1 justify-between md:w-48">
          <span className="truncate">{selectedUserNames.length > 0 ? selectedUserNames.join(", ") : "选择用户"}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-2">
        <input
          type="search"
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder="搜索"
          aria-label="搜索"
          className="mb-1 h-9 w-full rounded-sm border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        />

        <div className="max-h-64 overflow-y-auto">
          {filteredUsers.map(user => (
            <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
              <input
                type="checkbox"
                checked={selectedUserIds.includes(user.id)}
                onChange={() => toggleUser(user.id)}
                className="size-4 accent-primary"
              />
              <Avatar className="size-6">
                <AvatarImage src={user.picturePath ?? undefined} alt={user.name} />
                <AvatarFallback className="text-xxs">{user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{user.name}</span>
            </label>
          ))}

          {filteredUsers.length === 0 && <p className="px-2 py-1.5 text-sm text-muted-foreground">No members found</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
