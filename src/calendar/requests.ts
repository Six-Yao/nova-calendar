import { CALENDAR_ITEMS_MOCK } from "@/calendar/mocks";
import type { IUser } from "@/calendar/interfaces";

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
  // TO DO: implement this
  // Increase the delay to better see the loading state
  // await new Promise(resolve => setTimeout(resolve, 800));
  return CALENDAR_ITEMS_MOCK;
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
