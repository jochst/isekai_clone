# Using the app away from home (Cloudflare Tunnel + Access)

The app keeps running on your home PC, with all its data, keys and the nightly update where they are. A Cloudflare
Tunnel makes it reachable at a subdomain of `juicebox.cc`, and Cloudflare Access puts a login in front of it.

- **No port forwarding:** the tunnel is an *outgoing* connection from your PC to Cloudflare, so T-Mobile's
  carrier-grade NAT doesn't matter.
- **Login:** Cloudflare Access asks for your login (a one-time code by email) before anything reaches your PC.
- **A second check in the app:** the app checks Access's signed token on every request from outside (`src/proxy.ts`),
  so the domain alone gets nowhere.
- **Not reachable on your network:** the app listens on `127.0.0.1` only, so other devices on your home network can't
  reach it directly either.
- **Free:** Cloudflare Zero Trust is free for up to 50 users.

The examples use `iz.juicebox.cc`; pick any subdomain you like and use it everywhere below.

Do all of this in the folder you normally run the app from (the one with `.env.local`, `dev.db` and `data/`).

## 1. Run the app in production mode

```powershell
npm run build
npm run serve        # http://localhost:3000, listening on 127.0.0.1 only
```

Open http://localhost:3000 and check it works. Stop it with Ctrl+C.

**Start it automatically at logon:**

1. Open Task Scheduler and choose **Create Task**.
2. Name: `ISEKAI ZERO server`. Tick **Run only when user is logged on**.
3. On the Triggers tab, choose **At log on** (your user).
4. On the Actions tab, set Program to `scripts\start-server.cmd` and "Start in" to the project folder.
5. On the Settings tab, untick **Stop the task if it runs longer than…**.

Output goes to `data\server.log`. The script builds once if there's no build yet. After you pull new code, run
`npm run build`, then right-click the task, **End**, **Run**.

Also set the PC to never sleep while plugged in (Settings → System → Power), or it won't answer from work.

## 2. Create the tunnel (Cloudflare dashboard)

1. Go to https://one.dash.cloudflare.com and pick your account.
   - The first time, Zero Trust asks you to choose a **team name** and the **Free** plan.
   - Your team domain is `<team name>.cloudflareaccess.com`. You'll need it in step 4.
2. Go to **Networks → Tunnels → Create a tunnel → Cloudflared**. Name it `home-pc`.
3. Choose **Windows**. Copy the install command it shows, which ends in a long token, and run it in an
   **Administrator** PowerShell. This installs `cloudflared` as a Windows service that starts with the PC.
   - If `cloudflared` isn't installed yet: `winget install --id Cloudflare.cloudflared`, then run the command.
4. Back in the dashboard the tunnel shows **Healthy**. Click **Next** and add a **Public hostname**:
   - **Subdomain:** `iz` · **Domain:** `juicebox.cc`
   - **Service:** `HTTP` · **URL:** `localhost:3000`
5. Save. Cloudflare creates the DNS record for you.

**Don't open the address yet:** it isn't protected until step 3, and the app refuses it until step 4.

## 3. Put Cloudflare Access in front (the login)

1. In Zero Trust go to **Access → Applications → Add an application → Self-hosted**.
2. **Application name:** `ISEKAI ZERO`. **Public hostname:** subdomain `iz`, domain `juicebox.cc`.
3. **Session duration:** whatever you like, e.g. 1 week (how often it asks you to sign in again).
4. Add a policy:
   - **Name:** `Me`
   - **Action:** Allow
   - **Include → Emails:** your email address
5. **Login methods:** keep **One-time PIN** (a code by email). You can add Google later.
6. Save. Open the application and copy its **Application Audience (AUD) Tag** from the Overview / Basic information.

## 4. Tell the app about it

Add these to `.env.local`, using your own values:

```ini
PUBLIC_HOSTS=iz.juicebox.cc
CF_ACCESS_TEAM_DOMAIN=yourteam.cloudflareaccess.com
CF_ACCESS_AUD=paste-the-aud-tag-here
```

Restart the server task (End, then Run).

## 5. Test it

1. **On your phone, with Wi-Fi off,** open https://iz.juicebox.cc.
2. **Sign in:** Cloudflare asks for your email, sends a code, and then the app loads.
3. **Try a different email:** it should be refused.
4. **From work:** some company networks block unfamiliar domains. If it's blocked there, that's the network, not the
   setup.

## How it fits together

```
browser at work ──https──▶ Cloudflare Access login ──▶ tunnel ──▶ cloudflared (service on your PC)
                                                                   └──▶ http://localhost:3000 (npm run serve)
                                                                         └─ src/proxy.ts: Access token valid?
```

- **API keys:** they stay in `.env.local` on your PC. Keys typed into Settings → Providers live only in that browser,
  so at work the app uses the `.env.local` ones.
- **Per-browser settings:** your choices in Settings → Providers (models, voices) and Default Chat Settings (including
  chat colours) are kept per browser. Set them once on the work browser. Chats, stories, characters and personas are
  shared, because they live on the PC.
- **Data:** chats, media and the catalog stay on your PC. The nightly update keeps running there.
- **If the PC is off or asleep,** Cloudflare shows an error page instead of the app.
- **Locking it again:** remove the public hostname from the tunnel (or stop the `cloudflared` service). The app keeps
  working at http://localhost:3000.
