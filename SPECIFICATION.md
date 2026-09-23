# AnymeX Tracker Add-on Specification

This document provides the complete technical specification for creating, maintaining, and testing custom Tracker Add-on manifests for **AnymeX**.

---

## 1. Architecture Overview

AnymeX Tracker Add-ons allow external anime and manga tracking and metadata platforms (e.g. Kitsu, Shikimori, Bangumi, Trakt, AniSearch) to integrate dynamically into AnymeX without modifying Dart source code.

Each add-on is defined by a single **JSON manifest file** that describes:
- **Identity & Capabilities**: ID, display name, icons, supported media (`anime`, `manga`).
- **Authentication**: `oauth2`, `token`, or `credentials`.
- **API Endpoints**: Base URL, global headers, and URL routes with parameter interpolation.
- **Dynamic Field Mapping**: Extract nested JSON values using dot-notation, arrays, and fallback operators (`||`).
- **Status Normalization**: Maps third-party reading/watching statuses to AnymeX canonical statuses (`CURRENT`, `PLANNING`, `COMPLETED`, `PAUSED`, `DROPPED`).

---

## 2. Manifest Schema Reference

### Root Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | Unique identifier (e.g. `"kitsu"`, `"shikimori"`). Snake-case or kebab-case. |
| `name` | `string` | **Yes** | User-friendly display name (e.g. `"Kitsu"`). |
| `version` | `string` | **Yes** | Semantic versioning (e.g. `"1.0.0"`). |
| `author` | `string` | **Yes** | Author or maintainer name. |
| `description`| `string` | No | Short summary displayed in the Add-ons manager. |
| `color` | `string` | No | Hex color code (e.g. `"#FD6585"`). Used for branding badges and theme tints. |
| `icon` | `string` | No | Remote URL to service favicon/logo (square PNG or SVG). |
| `capabilities`| `array[string]` | **Yes** | Supported media types: `["anime"]`, `["manga"]`, or `["anime", "manga"]`. |
| `auth` | `object` | **Yes** | Authentication configuration (see Section 3). |
| `api` | `object` | **Yes** | Base API configuration (see Section 4). |
| `endpoints` | `object` | **Yes** | Endpoint definitions (see Section 5). |
| `status_map`| `object` | **Yes** | Map remote status strings to AnymeX canonical statuses. |
| `reverse_status_map` | `object` | **Yes** | Map AnymeX canonical statuses back to remote status strings. |

---

## 3. Authentication Configurations

AnymeX supports 3 authentication methods via `auth.type`:

### 3.1. `oauth2`
Used by modern OAuth2 services with web authorization.

```json
"auth": {
  "type": "oauth2",
  "auth_url": "https://service.com/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=user_rates",
  "token_url": "https://service.com/oauth/token",
  "redirect_uri": "anymex://callback",
  "client_id": "OPTIONAL_CLIENT_ID",
  "client_secret": "OPTIONAL_CLIENT_SECRET",
  "token_response_path": "access_token",
  "refresh_token_path": "refresh_token"
}
```

- When the user taps **Connect**, AnymeX opens a secure in-app browser to `auth_url`.
- AnymeX intercepts the redirect to `redirect_uri` (`anymex://callback`), extracts `code` or `access_token`, and handles token exchange via `token_url`.

### 3.2. `token` (Personal Access Token / API Key)
Prompts the user with an input dialog to paste their API token.

```json
"auth": {
  "type": "token",
  "instructions_url": "https://service.com/settings/api"
}
```

- An optional `instructions_url` provides a link opening the token generation page in the browser.
- The entered token is attached automatically to requests in the `Authorization: Bearer <TOKEN>` header.

### 3.3. `credentials` (Username & Password)
Prompts the user with a modal dialog asking for Username and Password.

```json
"auth": {
  "type": "credentials",
  "login_url": "https://service.com/api/oauth/token",
  "body_template": {
    "grant_type": "password",
    "username": "{username}",
    "password": "{password}"
  },
  "token_response_path": "access_token"
}
```

---

## 4. API Configuration

```json
"api": {
  "base_url": "https://api.service.com/v1",
  "headers": {
    "Accept": "application/json",
    "User-Agent": "AnymeX"
  }
}
```

- `base_url`: Prefix added to all relative endpoint URLs.
- `headers`: Sent with every HTTP request. If user is logged in, `Authorization: Bearer <TOKEN>` is automatically included.

---

## 5. Endpoints & URL Interpolation

### Available URL Placeholders

| Placeholder | Context | Description |
| :--- | :--- | :--- |
| `{query}` | Search | URL-encoded search keyword entered by user. |
| `{page}` | Search / Pagination | 1-indexed page number (`1`, `2`, `3`...). |
| `{offset}` | Search / Pagination | Calculated offset: `(page - 1) * limit`. |
| `{limit}` | Search / List | Number of items per page configured in `endpoint.limit` (default: `20`). |
| `{type}` | Search / Details / Library | `"anime"` or `"manga"`. |
| `{id}` | Details | Remote media ID. |
| `{userId}` | Library | Authenticated user ID (extracted from `user_profile`). |
| `{status}` | Library / Update | Status string (e.g. `"watching"` or canonical `"CURRENT"`). |
| `{entryId}` | Update / Delete | ID of the library list entry. |
| `{progress}` | Update Entry | Watched episode or read chapter number. |
| `{score}` | Update Entry | Rating or score given by user. |

### 5.1. `home_sections`
Array of carousel sections displayed on the AnymeX home tab:

```json
"home_sections": [
  {
    "title": "Trending Anime",
    "url": "/trending/anime",
    "is_anime": true,
    "variant": "regular",
    "items_path": "data"
  }
]
```

- `variant`: UI style for the carousel cards. Options: `"regular"`, `"cover"`, or `"big"`.
- `items_path`: Path to the array of items in the API response.

### 5.2. `search`
Handles keyword search across anime or manga:

```json
"search": {
  "url": "/search/{type}?q={query}&page={page}&offset={offset}&limit={limit}",
  "method": "GET",
  "items_path": "data",
  "limit": 20,
  "mapping": { ... }
}
```

- `limit`: Number of items to fetch per page (default: `20`).
- If the remote API uses page-based pagination, use `page={page}&limit={limit}`.
- If the remote API uses offset-based pagination, use `offset={offset}&limit={limit}`.

### 5.3. `details`
Fetches complete information for an anime or manga:

```json
"details": {
  "url": "/{type}/{id}",
  "method": "GET",
  "response_path": "data",
  "mapping": { ... }
}
```

### 5.4. `user_profile`
Fetches logged-in user details:

```json
"user_profile": {
  "url": "/users/me",
  "method": "GET",
  "response_path": "data",
  "mapping": {
    "id": "id",
    "name": "username",
    "avatar": "avatar_url"
  }
}
```

### 5.5. `user_library`
Fetches the user's watch/reading list:

```json
"user_library": {
  "url": "/users/{userId}/library?type={type}",
  "method": "GET",
  "items_path": "data",
  "mapping": {
    "id": "id",
    "mediaId": "media_id",
    "title": "media.title || title",
    "poster": "media.poster || poster",
    "progress": "episodes_watched",
    "totalEpisodes": "media.totalEpisodes",
    "totalChapters": "media.totalChapters",
    "status": "status",
    "score": "score"
  }
}
```

> [!TIP]
> Do **not** hardcode status filters like `&status={status}` in `user_library.url` unless the API strictly requires it. By omitting status filters, AnymeX fetches your full library across all statuses in one request, categorizing items automatically via `status_map`.

### User Library UI & Calendar Integration
When logged into a Tracker Add-on:
1. **Home Page Lists**: AnymeX displays **ANIME LIST** and/or **MANGA LIST** cards at the top of the Home feed based on `capabilities` (`anime`, `manga`), showing the total count of items in your library. Tapping a card opens the interactive list screen (`AnimeList` / `AnilistMangaList`), categorized by status tabs (`WATCHING`, `COMPLETED`, `PAUSED`, `DROPPED`, `PLANNING`, `ALL`).
2. **Continue Watching / New Episodes**: AnymeX automatically extracts active anime (`CURRENT` / `WATCHING`) and calculates release dates for airing episodes directly on your home feed.
3. **Calendar Integration**: Tapping the **Calendar** (available under the **OTHER** button on Home or via Features) lets you filter airing schedules by **My List**. AnymeX correlates entries between the airing calendar and your add-on library by Media ID, MAL ID (e.g. Shikimori), and English / Romaji Titles.
```

### 5.6. `update_entry` & `delete_entry`
Synchronizes watch/reading progress back to the remote service:

```json
"update_entry": {
  "url": "/library/{entryId}",
  "method": "PATCH",
  "body_template": {
    "progress": "{progress}",
    "status": "{status}",
    "score": "{score}"
  }
},
"delete_entry": {
  "url": "/library/{entryId}",
  "method": "DELETE"
}
```

---

## 6. Dynamic Path Mapping Syntax

Addon manifests use a powerful extractor syntax to navigate arbitrary JSON structures:

### 1. Dot Notation
Access nested fields:
`"attributes.titles.en"` -> navigates `{ "attributes": { "titles": { "en": "..." } } }`

### 2. Array Wildcards & Indexing
- `"data[0].id"`: Access the first element of an array.
- `"data[*].name"`: Collect all `name` fields into a list.

### 3. Fallback Chains (`||`)
Try multiple candidate keys in order until a non-null, non-empty value is found:
```json
"title": "attributes.canonicalTitle || attributes.titles.en || attributes.titles.en_jp"
```

### Supported Media Fields

| Mapping Key | Description |
| :--- | :--- |
| `id` | Media ID (string or number). |
| `title` | Main display title. |
| `romajiTitle` | Alternative / Romaji / Native title. |
| `poster` | Vertical poster/cover image URL. |
| `cover` | Horizontal banner/backdrop image URL. |
| `description` | Synopsis / description text. |
| `rating` | Score or rating (0 - 100 or 0 - 10). |
| `status` | Airing/publishing status (`FINISHED`, `RELEASING`, etc.). |
| `totalEpisodes` | Total episode count for anime. |
| `totalChapters` | Total chapter count for manga. |
| `popularity` | Member count or ranking score. |
| `premiered` | Start date or release year (e.g. `"2024-01-07"`). |
| `genres` | Array or comma-delimited string of genres. |
| `duration` | Runtime in minutes per episode. |

---

## 7. Status Normalization

AnymeX defines 5 canonical media statuses:
1. `CURRENT` (Watching / Reading)
2. `PLANNING` (Plan to watch / Plan to read)
3. `COMPLETED` (Completed)
4. `PAUSED` (On Hold)
5. `DROPPED` (Dropped)

### Example `status_map` and `reverse_status_map`:

```json
"status_map": {
  "watching": "CURRENT",
  "reading": "CURRENT",
  "planned": "PLANNING",
  "completed": "COMPLETED",
  "on_hold": "PAUSED",
  "dropped": "DROPPED"
},
"reverse_status_map": {
  "CURRENT": "watching",
  "PLANNING": "planned",
  "COMPLETED": "completed",
  "PAUSED": "on_hold",
  "DROPPED": "dropped"
}
```

---

## 8. Contributing a New Service

1. Create `services/<service-id>.json` using [example_service.json](services/example_service.json) as a starting point.
2. Test your manifest in AnymeX using **Sideload Add-on** (paste JSON or local URL).
3. Add your entry to `addons.json`:
   ```json
   {
     "id": "my_service",
     "name": "My Service",
     "version": "1.0.0",
     "author": "Your Name",
     "description": "Short description",
     "icon": "https://example.com/icon.png",
     "color": "#HEX_COLOR",
     "capabilities": ["anime", "manga"],
     "auth_type": "oauth2",
     "manifest_url": "https://raw.githubusercontent.com/Shebyyy/AnymeX-Addon-Services/main/services/my_service.json"
   }
   ```
4. Open a Pull Request to [AnymeX-Addon-Services](https://github.com/Shebyyy/AnymeX-Addon-Services).
