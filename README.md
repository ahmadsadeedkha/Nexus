# Nexus — Backend APIs Needed

Frontend currently runs on mock data (`src/data/*.ts`) with no real network calls. APIs required to make it functional:

## Auth
- `POST /api/auth/register` — create user (entrepreneur/investor), hash password, return JWT
- `POST /api/auth/login` — verify credentials, return JWT
- `POST /api/auth/forgot-password` — generate reset token, email it
- `POST /api/auth/reset-password` — validate token, update password
- `GET /api/auth/me` — rehydrate session on load

## Users
- `GET /api/entrepreneurs` — list entrepreneurs (search/filter/pagination)
- `GET /api/investors` — list investors (search/filter/pagination)
- `GET /api/users/:id` — profile detail
- `PATCH /api/users/:id` — update profile

## Collaboration Requests
- `GET /api/collaboration-requests?entrepreneurId=` / `?investorId=`
- `POST /api/collaboration-requests` — send request
- `PATCH /api/collaboration-requests/:id` — accept/reject

## Messaging
- `GET /api/conversations` — list conversations for logged-in user
- `GET /api/messages?withUser=:id` — messages with a specific user
- `POST /api/messages` — send message (+ real-time via Socket.IO)
- `PATCH /api/messages/:id/read` — mark read

## Documents
- `POST /api/documents` — upload
- `GET /api/documents` — list
- `GET /api/documents/:id/download`
- `PATCH /api/documents/:id/share`
- `DELETE /api/documents/:id`

## Notifications
- `GET /api/notifications` — per user
- `PATCH /api/notifications/:id/read`

## Deals
- `GET /api/deals`
- `POST /api/deals`
- `PATCH /api/deals/:id` — status updates

## Settings
- `PATCH /api/users/:id/password`
- `PATCH /api/users/:id/preferences`

## Dashboards
- `GET /api/dashboard/entrepreneur`
- `GET /api/dashboard/investor`
