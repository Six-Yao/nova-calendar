import { CALENDAR_ITEMS_MOCK } from "@/calendar/mocks";
import type { IEvent, IUser } from "@/calendar/interfaces";
import type { TEventColor } from "@/calendar/types";
import { getScheduleBindings } from "@/calendar/schedule-bindings";

const YUQUE_BASE_URL = process.env.YUQUE_BASE_URL ?? "https://www.yuque.com/api/v2/";

type YuqueResponse<T> = {
  data?: T;
};

type YuqueUser = {
  id?: number | string;
  name?: string;
  avatar_url?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
};

type YuqueMember = {
  status?: number;
  user?: YuqueUser;
  user_id?: number | string;
};

type IcsEvent = {
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  dtstart?: string;
  dtend?: string;
};

const MEMBER_COLORS: TEventColor[] = ["blue", "green", "red", "yellow", "purple", "orange", "gray"];

function applyMemberColors(events: IEvent[]) {
  const memberColors = new Map(
    Array.from(new Set(events.map(event => event.user.id)))
      .sort()
      .map((userId, index) => [userId, MEMBER_COLORS[index % MEMBER_COLORS.length]] as const),
  );

  return events.map(event => ({ ...event, color: memberColors.get(event.user.id) ?? MEMBER_COLORS[0] }));
}

function unfoldIcsLines(ics: string) {
  return ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function unescapeIcsText(value: string) {
  return value.replace(/\\([\\;,n])/g, (_match, character: string) => (character === "n" ? "\n" : character));
}

function parseIcsDate(value: string) {
  const date = value.replace(/[^0-9]/g, "");

  if (date.length !== 8 && date.length !== 14) {
    return null;
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6)) - 1;
  const day = Number(date.slice(6, 8));
  const hour = date.length === 14 ? Number(date.slice(8, 10)) : 0;
  const minute = date.length === 14 ? Number(date.slice(10, 12)) : 0;
  const second = date.length === 14 ? Number(date.slice(12, 14)) : 0;

  return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
}

function getEventId(uid: string, index: number) {
  let hash = 0;
  for (const character of `${uid}-${index}`) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  return Math.abs(hash);
}

function parseIcsEvents(ics: string, user: IUser, color: TEventColor): IEvent[] {
  const events: IcsEvent[] = [];
  let currentEvent: IcsEvent | null = null;

  for (const line of unfoldIcsLines(ics)) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (currentEvent) events.push(currentEvent);
      currentEvent = null;
      continue;
    }

    if (!currentEvent) continue;
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) continue;

    const property = line.slice(0, separatorIndex).split(";")[0].toLowerCase();
    const value = unescapeIcsText(line.slice(separatorIndex + 1));
    if (property === "uid") currentEvent.uid = value;
    if (property === "summary") currentEvent.summary = value;
    if (property === "description") currentEvent.description = value;
    if (property === "location") currentEvent.location = value;
    if (property === "dtstart") currentEvent.dtstart = value;
    if (property === "dtend") currentEvent.dtend = value;
  }

  return events.flatMap((event, index) => {
    const startDate = event.dtstart ? parseIcsDate(event.dtstart) : null;
    const endDate = event.dtend ? parseIcsDate(event.dtend) : null;

    if (!startDate || !endDate || !event.summary) return [];

    const details = [event.description, event.location].filter(Boolean).join("\n\n");
    return [{
      id: getEventId(event.uid ?? "nju-event", index),
      startDate,
      endDate,
      title: event.summary,
      color,
      description: details,
      user,
    }];
  });
}

function normalizeAvatarUrl(avatar: string | null | undefined) {
  if (!avatar) {
    return null;
  }

  try {
    return new URL(avatar, YUQUE_BASE_URL).toString();
  } catch {
    return null;
  }
}

function getAvatarPath(avatar: string | null | undefined) {
  const normalizedAvatarUrl = normalizeAvatarUrl(avatar);

  return normalizedAvatarUrl ? `/api/yuque-avatar?url=${encodeURIComponent(normalizedAvatarUrl)}` : null;
}

async function getYuque<T>(endpoint: string, params?: Record<string, string>) {
  const token = process.env.YUQUE_TOKEN;

  if (!token) {
    throw new Error("YUQUE_TOKEN is not configured");
  }

  const url = new URL(endpoint, YUQUE_BASE_URL.endsWith("/") ? YUQUE_BASE_URL : `${YUQUE_BASE_URL}/`);
  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": token,
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Yuque API returned ${response.status} for ${endpoint}`);
  }

  return response.json() as Promise<YuqueResponse<T>>;
}

export const getEvents = async () => {
  const bindings = getScheduleBindings();
  if (bindings.length === 0) return applyMemberColors(CALENDAR_ITEMS_MOCK);

  const memberColors = new Map(
    [...bindings]
      .sort((first, second) => first.user.id.localeCompare(second.user.id))
      .map((binding, index) => [binding.user.id, MEMBER_COLORS[index % MEMBER_COLORS.length]] as const),
  );

  const events = await Promise.all(
    bindings.map(async binding => {
      try {
        const response = await fetch(binding.icsUrl.replace(/^webcal:/, "https:"), { cache: "no-store" });
        if (!response.ok) return [];
        return parseIcsEvents(await response.text(), binding.user, memberColors.get(binding.user.id) ?? MEMBER_COLORS[0]);
      } catch (_error) {
        return [];
      }
    }),
  );

  return applyMemberColors(events.flat());
};

export const getUsers = async () => {
  if (!process.env.YUQUE_TOKEN) {
    return [];
  }

  try {
    const groupId = process.env.YUQUE_GROUP_ID ?? String((await getYuque<YuqueUser>("user")).data?.id ?? "");

    if (!groupId) {
      throw new Error("YUQUE_GROUP_ID is not configured and the current user ID could not be determined");
    }

    const users: IUser[] = [];
    let page = 1;

    while (true) {
      const response = await getYuque<{ members?: YuqueMember[] }>(`groups/${groupId}/statistics/members`, {
        page: String(page),
      });
      const members = response.data?.members ?? [];

      if (members.length === 0) {
        break;
      }

      users.push(
        ...members.flatMap(member => {
          const user = member.user;
          const id = user?.id ?? member.user_id;

          if (id === undefined || !user?.name || (member.status !== undefined && member.status !== 1)) {
            return [];
          }

          return [{
            id: String(id),
            name: user.name,
            picturePath: getAvatarPath(user.avatar_url ?? user.avatar ?? user.avatarUrl),
          }];
        }),
      );
      page += 1;
    }

    return users;
  } catch (_error) {
    return [];
  }
};
