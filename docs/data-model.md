# QuickNotes Data Model Specification

This document details the relational database design, table schemas, entity relationships, and indexing strategy for the QuickNotes backend platform.

## Entities & Attributes

1. **`users`**: Represents registered platform accounts.
   * `id` (INT, Primary Key)
   * `username` (VARCHAR(50), Unique, Not Null)
   * `email` (VARCHAR(100), Unique, Not Null)
   * `created_at` (TIMESTAMP)

2. **`notes`**: Represents individual user notes.
   * `id` (INT, Primary Key)
   * `user_id` (INT, Foreign Key referencing `users.id`)
   * `title` (VARCHAR(100), Not Null)
   * `body` (TEXT)
   * `created_at` (TIMESTAMP)

3. **`tags`**: Stores categorization labels.
   * `id` (INT, Primary Key)
   * `name` (VARCHAR(30), Unique, Not Null)

4. **`note_tags`**: Junction table linking notes and tags.
   * `note_id` (INT, Foreign Key referencing `notes.id`)
   * `tag_id` (INT, Foreign Key referencing `tags.id`)
   * Primary Key: (`note_id`, `tag_id`)

---

## Entity Relationships

* **User to Notes (1:N - One-to-Many):** A single user can create many notes, but each note belongs to exactly one user.
* **Notes to Tags (M:N - Many-to-Many):** A single note can have multiple tags, and a single tag can be assigned to multiple notes. This requires the `note_tags` junction table to resolve the many-to-many relationship into two 1:N relationships.

---

## DDL SQL Statements

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
##Example SQL Queries

#Query 1: Get all notes for a specific user ordered by newest first
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 42
ORDER BY created_at DESC;

## Query 2: Fetch a note with all associated tag names (JOIN)
SELECT n.id, n.title, n.body, t.name AS tag_name
FROM notes n
JOIN note_tags nt ON n.id = nt.note_id
JOIN tags t ON t.id = nt.tag_id
WHERE n.id = 101;
##Query 3: Count total notes per tag
SELECT t.name, COUNT(nt.note_id) AS total_notes
FROM tags t
LEFT JOIN note_tags nt ON t.id = nt.tag_id
GROUP BY t.id, t.name;
##Indexing Strategy
CREATE INDEX idx_notes_user_id ON notes(user_id);

##Reason for IndexUsers frequently view their dashboard, which requires querying SELECT * FROM notes WHERE user_id = ?. Without an index on user_id, the database engine performs a full table scan ($O(N)$) across all system notes. Creating a B-Tree index on user_id optimizes query execution to logarithmic lookup time ($O(\log N)$).
##Architectural Justification: SQL vs. NoSQLFor QuickNotes, a Relational SQL Database (PostgreSQL) is the optimal choice. The application domain requires strict user-data isolation, structured entity relationships (Users $\rightarrow$ Notes $\rightarrow$ Tags), and ACID transaction guarantees during concurrent updates. SQL engines easily manage complex join queries and enforce referential integrity constraints (such as ON DELETE CASCADE), ensuring orphan notes or tags are never left in the system.