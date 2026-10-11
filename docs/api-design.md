# QuickNotes REST API Specification

This specification details the production REST API design for the QuickNotes backend platform.

## REST Endpoints Overview

| Method | Path | Description | Success Code |
|---|---|---|---|
| `GET` | `/api/v1/notes` | List all notes for the authenticated user | `200 OK` |
| `GET` | `/api/v1/notes/:id` | Retrieve a single note by ID | `200 OK` |
| `POST` | `/api/v1/notes` | Create a new note | `201 Created` |
| `PUT` | `/api/v1/notes/:id` | Update an existing note completely | `200 OK` |
| `DELETE` | `/api/v1/notes/:id` | Delete a note by ID | `204 No Content` |
| `GET` | `/api/v1/notes/search` | Search notes by keyword using query params | `200 OK` |

---

## Request & Response JSON Examples

### 1. Creating a Note (`POST /api/v1/notes`)

**Request Payload:**
```json
{
  "title": "System Architecture Review",
  "body": "Prepare load estimation slides for Day 8 presentation.",
  "tagIds": [1, 3]
}
##Success Response Payload (201 Created):
{
  "id": 101,
  "userId": 42,
  "title": "System Architecture Review",
  "body": "Prepare load estimation slides for Day 8 presentation.",
  "tags": [
    { "id": 1, "name": "Work" },
    { "id": 3, "name": "Urgent" }
  ],
  "createdAt": "2026-10-11T12:00:00Z",
  "updatedAt": "2026-10-11T12:00:00Z"
}

###2. Listing Notes (GET /api/v1/notes)
Success Response Payload (200 OK):

{
  "total": 2,
  "data": [
    {
      "id": 101,
      "userId": 42,
      "title": "System Architecture Review",
      "body": "Prepare load estimation slides for Day 8 presentation.",
      "createdAt": "2026-10-11T12:00:00Z"
    },
    {
      "id": 100,
      "userId": 42,
      "title": "Grocery List",
      "body": "Milk, Eggs, Bread",
      "createdAt": "2026-10-10T09:30:00Z"
    }
  ]
}
##Error Handling & HTTP Status Codes
#The API uses standard HTTP response status codes to indicate success or failure.
Here is the clean Markdown table for your error handling and HTTP status codes:

| Code | Status Title | Reason / Trigger |
| --- | --- | --- |
| **400** | Bad Request | Invalid JSON payload or validation failure (e.g., missing title or title exceeding 100 chars). |
| **401** | Unauthorized | Missing or invalid authentication token in request header. |
| **403** | Forbidden | Authenticated user lacks permission to access or modify the requested resource. |
| **404** | Not Found | The requested endpoint path or note ID does not exist. |
| **500** | Internal Server Error | Unhandled server error or database outage. |
##Example Error Response Body (400 Bad Request)
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "title",
      "issue": "Title is required and must not exceed 100 characters."
    }
  ],
  "timestamp": "2026-10-11T12:05:00Z"
}


