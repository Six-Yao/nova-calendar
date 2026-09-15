"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCalendar } from "@/calendar/contexts/calendar-context";

interface IProps {
  children: React.ReactNode;
}

export function ScheduleLinkDialog({ children }: IProps) {
  const { users, setSelectedUserIds } = useCalendar();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [school, setSchool] = useState("南京大学本科生");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBound, setIsBound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setUsername("");
    setPassword("");
    setSelectedUserId("");
    setSearchQuery("");
    setIsBound(false);
    setError(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = users.find(item => item.id === selectedUserId);
    if (!user) {
      setError("请选择要绑定的语雀用户");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/nju-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, school, userId: user.id, userName: user.name, picturePath: user.picturePath }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) throw new Error(result.error ?? "绑定课表失败");
      setIsBound(true);
      setSelectedUserIds([user.id]);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "获取课表链接失败");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find(user => user.id === selectedUserId);
  const filteredUsers = users.filter(user => user.name.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open);
        if (!open) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>获取课表链接</DialogTitle>
          <DialogDescription>通过 schedule 登录后生成可订阅的 ICS 日历链接。</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>绑定语雀用户</Label>
            <Popover open={isUserSelectOpen} onOpenChange={setIsUserSelectOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="justify-between">
                  {selectedUser ? selectedUser.name : "选择用户"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Search members"
                  aria-label="Search members"
                  className="mb-1 h-9 w-full rounded-sm border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="max-h-64 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
                      <input
                        type="radio"
                        name="schedule-user"
                        checked={selectedUserId === user.id}
                        onChange={() => {
                          setSelectedUserId(user.id);
                          setIsUserSelectOpen(false);
                        }}
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule-school">学校接口</Label>
            <Select value={school} onValueChange={setSchool}>
              <SelectTrigger id="schedule-school">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="南京大学本科生">南京大学本科生</SelectItem>
                <SelectItem value="南京大学研究生">南京大学研究生</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule-username">账号</Label>
            <Input id="schedule-username" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule-password">密码</Label>
            <Input id="schedule-password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {isBound && <p className="text-sm text-green-600">课表已绑定到 {selectedUser?.name}。</p>}

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              <ExternalLink />
              {isLoading ? "正在登录..." : "绑定课表"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}