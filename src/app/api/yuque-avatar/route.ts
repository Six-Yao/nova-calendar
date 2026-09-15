const ALLOWED_HOSTS = new Set(["cdn.nlark.com", "mdn.alipayobjects.com", "gw.alipayobjects.com"]);

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("url");

  if (!source) {
    return new Response("Missing avatar URL", { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(source);
  } catch {
    return new Response("Invalid avatar URL", { status: 400 });
  }

  if (sourceUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(sourceUrl.hostname)) {
    return new Response("Avatar host is not allowed", { status: 403 });
  }

  const response = await fetch(sourceUrl, {
    next: { revalidate: 86400 },
  });

  if (!response.ok || !response.body) {
    return new Response("Avatar could not be loaded", { status: 404 });
  }

  return new Response(response.body, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
    },
  });
}
