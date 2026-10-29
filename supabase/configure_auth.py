"""Apply this project's Supabase auth settings through the Management API.

Sets the site URL and allowed redirect links, the minimum password length, and custom SMTP
(so sign-up emails are not limited by Supabase's built-in sender).

Put these in the git-ignored .env at the repository root:
  SUPABASE_ACCESS_TOKEN=sbp_...   (Dashboard > Account > Access Tokens > Generate new token)
  EMAIL_USER, EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT   (the mailbox that sends the emails)

Run from the repository root:
  python supabase/configure_auth.py --dry-run    show what would change
  python supabase/configure_auth.py              apply it
"""

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

PROJECT_REF = "peiqvrmqndiuzymqwkmk"
SITE_URL = "https://umair-rai.github.io/erasmus-mundus-tracker/"
REDIRECT_URLS = [SITE_URL, "http://localhost:5173/", "http://localhost:8000/", "http://127.0.0.1:8000/"]
SENDER_NAME = "Mundus"
API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth"
SECRET_FIELDS = {"smtp_pass"}


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip().strip("\"'")
    return env


def call(token: str, method: str, body: dict | None = None) -> dict:
    request = urllib.request.Request(
        API,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": "mundus-configure-auth/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"Supabase API said {exc.code} {exc.reason}: {exc.read().decode(errors='replace')[:300]}") from None


def show(key: str, value) -> str:
    return "(hidden)" if key in SECRET_FIELDS else repr(value)


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    env = load_env(Path(__file__).resolve().parents[1] / ".env")
    missing = [k for k in ("EMAIL_USER", "EMAIL_PASSWORD", "SMTP_HOST", "SMTP_PORT") if not env.get(k)]
    if missing:
        raise SystemExit(f"Missing in .env: {', '.join(missing)}")

    wanted = {
        "site_url": SITE_URL,
        "uri_allow_list": ",".join(REDIRECT_URLS),
        "password_min_length": 8,
        "smtp_host": env["SMTP_HOST"],
        "smtp_port": str(env["SMTP_PORT"]),
        "smtp_user": env["EMAIL_USER"],
        "smtp_pass": env["EMAIL_PASSWORD"],
        "smtp_admin_email": env["EMAIL_USER"],
        "smtp_sender_name": SENDER_NAME,
    }

    token = env.get("SUPABASE_ACCESS_TOKEN", "")
    if not token:
        print("SUPABASE_ACCESS_TOKEN is not in .env yet, so here is the plan only:\n")
        for key, value in wanted.items():
            print(f"  {key:20} -> {show(key, value)}")
        raise SystemExit("\nAdd the token to .env and run this again.")

    current = call(token, "GET")
    unknown = [k for k in wanted if k not in current]
    patch = {k: v for k, v in wanted.items() if k in current}
    print("Changes for project", PROJECT_REF)
    for key, value in patch.items():
        before = current.get(key)
        same = before == value or (key in SECRET_FIELDS and before in (None, "", value))
        print(f"  {key:20} {show(key, before)} -> {show(key, value)}{'   (already set)' if same and key not in SECRET_FIELDS else ''}")
    if unknown:
        print("  not recognised by the API, skipped:", ", ".join(unknown))
    if dry_run:
        print("\nDry run: nothing was changed.")
        return

    call(token, "PATCH", patch)
    after = call(token, "GET")
    bad = [k for k, v in patch.items() if k not in SECRET_FIELDS and after.get(k) != v]
    print("\nApplied." if not bad else f"\nApplied, but these did not read back as expected: {', '.join(bad)}")
    print("SMTP enabled:", bool(after.get("smtp_host")), "| email confirmation on:", not after.get("mailer_autoconfirm", False))


if __name__ == "__main__":
    main()
