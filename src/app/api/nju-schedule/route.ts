import { NextResponse } from "next/server";

import { saveScheduleBinding } from "@/calendar/schedule-bindings";

const configuredScheduleBaseUrl = process.env.NJU_SCHEDULE_BASE_URL;
if (!configuredScheduleBaseUrl) {
  throw new Error("NJU_SCHEDULE_BASE_URL is required");
}

const SCHEDULE_BASE_URL = configuredScheduleBaseUrl.replace(/\/$/, "");

type LoginRequest = {
  username?: string;
  password?: string;
  school?: string;
  userId?: string;
  userName?: string;
  picturePath?: string | null;
};

function getSessionCookie(response: Response) {
  const setCookie = response.headers.get("set-cookie");
  const sessionId = setCookie?.match(/(?:^|;\s*)session_id=([^;]+)/)?.[1];

  return sessionId ? `session_id=${sessionId}` : null;
}

async function readServerFunctionResult<T>(response: Response, action: string) {
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${action} failed with ${response.status}: ${body.slice(0, 300)}`);
  }

  if (!body) return undefined as T;

  const parsed = JSON.parse(body) as T | { Ok?: T; data?: T; error?: string };
  if (typeof parsed === "object" && parsed !== null) {
    if ("error" in parsed && parsed.error) throw new Error(parsed.error);
    if ("Ok" in parsed) return parsed.Ok as T;
    if ("data" in parsed) return parsed.data as T;
  }

  return parsed as T;
}

async function callSchedule<T>(path: string, body: unknown, cookie: string, action: string) {
  const response = await fetch(`${SCHEDULE_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return readServerFunctionResult<T>(response, action);
}

export async function POST(request: Request) {
  try {
    const { username, password, school = "南京大学本科生", userId, userName, picturePath = null } = (await request.json()) as LoginRequest;

    if (!username || !password || !userId || !userName) {
      return NextResponse.json({ error: "账号、密码和语雀用户不能为空" }, { status: 400 });
    }

    const adaptersResponse = await fetch(`${SCHEDULE_BASE_URL}/api/all_adapters`, {
      cache: "no-store",
    });
    const cookie = getSessionCookie(adaptersResponse);
    if (!cookie) throw new Error("schedule 未返回登录会话");

    await readServerFunctionResult<string[]>(adaptersResponse, "获取学校列表");
    await callSchedule("/api/set_school", { name: school }, cookie, "选择学校");
    const key = await callSchedule<string>(
      "/api/login",
      { username, password, captcha_answer: null },
      cookie,
      "登录 schedule",
    );

    if (!key || typeof key !== "string") throw new Error("schedule 未返回订阅 key");

    const icsUrl = `${SCHEDULE_BASE_URL.replace(/^https:/, "webcal:")}/calendar/${encodeURIComponent(school)}/${encodeURIComponent(key)}/schedule.ics`;
    saveScheduleBinding({ user: { id: userId, name: userName, picturePath }, icsUrl });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "获取课表链接失败" }, { status: 502 });
  }
}