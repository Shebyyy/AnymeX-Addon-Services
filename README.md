# AnymeX Add-on Services Repository

Welcome to the official repository for **AnymeX Add-on Services**!

This repository hosts community-contributed tracking and metadata services (e.g., Kitsu, Shikimori, Bangumi, Trakt, AniSearch) that can be installed directly inside [AnymeX](https://github.com/RyanYuuki/AnymeX).

---

## 📦 How to Use in AnymeX

1. Open **AnymeX**.
2. Go to **Settings > Accounts > Tracker Add-ons**.
3. Under the **Repository** tab, you will see all services listed here.
4. Tap **Install** on any service to add it.
5. In **Settings > Accounts**, tap **Connect** to sign in with your account.
6. Use the **Choose Provider** sheet to make it your active service!

---

## 🛠 Adding a New Service

To contribute a new service:

1. Create a JSON manifest in `services/<service-id>.json`.
2. Add your service entry to `addons.json`.
3. Submit a Pull Request!

### Manifest Schema Overview

```json
{
  "id": "my_tracker",
  "name": "My Tracker",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Description of the service",
  "color": "#HEX_COLOR",
  "icon": "https://example.com/favicon.ico",
  "capabilities": ["anime", "manga"],
  "auth": {
    "type": "oauth2 | token | credentials"
  },
  "api": {
    "base_url": "https://api.example.com"
  },
  "endpoints": {
    "home_sections": [...],
    "search": { ... },
    "details": { ... },
    "user_profile": { ... },
    "user_library": { ... },
    "update_entry": { ... }
  },
  "status_map": {
    "remote_status": "CURRENT | PLANNING | COMPLETED | PAUSED | DROPPED"
  }
}
```
