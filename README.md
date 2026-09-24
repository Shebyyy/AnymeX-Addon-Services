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

## 📚 Documentation & Examples

- **[Full Specification Document (SPECIFICATION.md)](SPECIFICATION.md)**: Complete reference of all manifest options, auth schemes, endpoint configurations, fallback mapping chains, and status maps.
- **[JSON Schema (schema.json)](schema.json)**: Official JSON Schema Draft-07 for IDE autocomplete, tooltips, and real-time validation.
- **[Comprehensive Example Manifest (services/example_service.json)](services/example_service.json)**: Fully populated template demonstrating every capability.
- **[Kitsu Manifest (services/kitsu.json)](services/kitsu.json)**: Working production manifest for Kitsu.io.
- **[Shikimori Manifest (services/shikimori.json)](services/shikimori.json)**: Working production manifest for Shikimori.one with OAuth2.

---

## 🛠️ Adding a New Service

To contribute a new service:

1. Copy [`services/example_service.json`](services/example_service.json) to `services/<service-id>.json`.
2. Ensure your file references `"$schema": "https://raw.githubusercontent.com/Shebyyy/AnymeX-Addon-Services/main/schema.json"` at the top for instant IDE feedback.
3. Configure your service API endpoints and dynamic mappings according to [SPECIFICATION.md](SPECIFICATION.md).
4. Test your manifest inside AnymeX using **Sideload Add-on** (paste raw JSON or test URL).
5. Open a Pull Request! (*`addons.json` and versions are managed automatically via CI*).
