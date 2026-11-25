
import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

// Cache singkat untuk hasil auth.me agar tidak selalu memanggil Apps Script.
// Hanya hidup selama instance fungsi masih aktif.
const ME_CACHE_TTL_MS = 2 * 60 * 1000;
const meCache = new Map<string, { at: number; body: unknown }>();

export async function POST(request: NextRequest) {
  try {
    if (!SCRIPT_URL) {
      throw new Error("APPS_SCRIPT_URL belum diatur.");
    }

    const body = await request.json();
    const action = body.action;
    const data = body.data ?? {};

    if (typeof action !== "string" || !action) {
      return NextResponse.json(
        { success: false, message: "Action tidak valid." },
        { status: 400 }
      );
    }

    const publicActions = [
      "auth.login",
      "auth.register",
      "public.review.get",
      "public.review.submit",
    ];

    let sessionToken: string | undefined;

    if (!publicActions.includes(action)) {
      const token = request.cookies.get("nfc_session")?.value;
      sessionToken = token;

      if (!token) {
        return NextResponse.json(
          {
            success: false,
            message: "Session tidak ditemukan. Silakan login.",
          },
          { status: 401 }
        );
      }

      data.token = token;

      if (action === "auth.me") {
        const hit = meCache.get(token);

        if (hit && Date.now() - hit.at < ME_CACHE_TTL_MS) {
          return NextResponse.json(hit.body);
        }
      }
    }

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, data }),
      cache: "no-store",
      redirect: "follow",
    });

    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Respons Apps Script bukan JSON: ${responseText.substring(0, 300)}`
      );
    }

    const output = { ...result };
    delete output.token;

    if (sessionToken) {
      if (action === "auth.me" && result.success) {
        meCache.set(sessionToken, { at: Date.now(), body: output });
      }

      if (action === "auth.logout") {
        meCache.delete(sessionToken);
      }
    }

    const nextResponse = NextResponse.json(output);

    if (action === "auth.login" && result.success && result.token) {
      nextResponse.cookies.set("nfc_session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 21600,
      });
    }

    if (action === "auth.logout" && result.success) {
      nextResponse.cookies.delete("nfc_session");
    }

    return nextResponse;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("BACKEND ERROR:", message);

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? message
            : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
