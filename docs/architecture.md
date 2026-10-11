# QuickNotes System Architecture & Scaling Specification

This document details the system architecture, load estimation, request workflows, and fault-tolerance design for scaling QuickNotes to 1 million users.

---

## 1. Requirements

### Functional Requirements
* Users can create, view, update, and delete text notes.
* Users can organize notes with tags and search notes by title/keyword.
* Notes must persist reliably across sessions.

### Non-Functional Requirements
* **High Availability:** 99.9% uptime.
* **Low Latency:** Sub-200ms API response time for read and write operations.
* **Scalability:** Ability to support 1M total registered users and handle peak traffic seamlessly.
* **Data Security & Integrity:** Strict user data isolation and encrypted communication via HTTPS/TLS.

---

## 2. Capacity Planning & Load Estimates

### Baseline Assumptions
* **Total Registered Users:** 1,000,000 (1M)
* **Daily Active Users (DAU):** 10% = 100,000 DAU
* **User Activity:**
  * 10 note reads (GET) per DAU / day
  * 2 note writes (POST/PUT) per DAU / day
* **Average Note Size:** 1 KB (0.5 KB title + 0.5 KB body)

### Traffic Calculations
* **Read Throughput (GET):**
  $$\frac{100,000 \times 10 \text{ reads}}{86,400 \text{ seconds}} \approx \mathbf{11.57 \text{ reads/sec (Average)}}$$
  * *Peak Read Throughput (5x multiplier):* $11.57 \times 5 = \mathbf{57.85 \text{ reads/sec}}$

* **Write Throughput (POST/PUT):**
  $$\frac{100,000 \times 2 \text{ writes}}{86,400 \text{ seconds}} \approx \mathbf{2.31 \text{ writes/sec (Average)}}$$
  * *Peak Write Throughput (5x multiplier):* $2.31 \times 5 = \mathbf{11.57 \text{ writes/sec}}$

### Storage Calculations
* **Daily Storage:** $100,000 \text{ DAU} \times 2 \text{ notes} \times 1 \text{ KB} = 200,000 \text{ KB} \approx 0.2 \text{ GB/day}$
* **Annual Storage Requirement:**
  $$0.2 \text{ GB/day} \times 365 \text{ days} = \mathbf{73 \text{ GB/year}}$$

---

## 3. Architecture Diagram

```text
                           [ Users / Web Browsers ]
                                      |
                                      v
                                 [ DNS (Route 53) ]
                                      |
                                      v
                         [ Content Delivery Network (CDN) ]
                                      |
                                      v
                            [ Load Balancer (ALB) ]
                                      |
                  +-------------------+-------------------+
                  |                                       |
                  v                                       v
          [ App Server 1 ]                         [ App Server 2 ]
              /   |   \                               /   |   \
             /    |    \                             /    |    \
            v     v     v                           v     v     v
     [In-Memory] [Queue] [Primary DB]       [In-Memory] [Queue] [Primary DB]
     [  Cache  ] [     ] [ (Writes) ]       [  Cache  ] [     ] [ (Writes) ]
        |          |          |                |          |          |
        |          v          |                |          v          |
        |      [Worker]       |                |      [Worker]       |
        |          |          v                |          |          |
        +----------|---> [Read Replica] <------+----------|----------+
                   |     [  (Reads)   ]                   |
                   v                                      v
          [ Object Storage ]                     [ Object Storage ]
          [ (Export Files) ]                     [ (Export Files) ]

##Component Responsibilities
DNS (Route 53): Resolves domain requests and directs traffic to the CDN/Load Balancer.

CDN (Cloudflare/CloudFront): Caches static web assets (HTML, CSS, JS) at edge locations to minimize latency.

Load Balancer (ALB): Distributes incoming API traffic across multiple application servers using health-checked round-robin routing.

App Servers (Stateless Node.js/Express): Executes REST business logic, validates input, and orchestrates database transactions.

In-Memory Cache (Redis): Stores user session tokens and frequently queried note summaries to relieve database read pressure.

Primary Database (PostgreSQL Master): Handles write transactions (INSERT, UPDATE, DELETE) enforcing strict ACID guarantees.

Read Replica Database: Asynchronously mirrors the primary database to serve heavy read queries (GET /notes).

Message Queue (RabbitMQ): Buffers asynchronous tasks such as sending welcome emails or processing bulk note PDF export requests.

Worker Service: Consumes jobs from the message queue in the background without blocking HTTP request threads.
##5. End-to-End Request FlowsFlow 1: Reading Notes (GET /notes)Client sends an HTTP GET /api/v1/notes request with a Bearer JWT token.Load Balancer forwards the request to an available App Server.App Server validates the token and checks the In-Memory Cache (Redis) for cached notes.Cache Hit: Returns cached JSON directly to the client ($<10\text{ms}$).Cache Miss: App Server queries the Read Replica Database, stores the fetched notes in Redis with a 5-minute TTL, and returns the response to the client.Flow 2: Creating a Note (POST /notes)Client submits a POST /api/v1/notes request with a JSON payload.App Server validates payload fields (checking that title exists and is $\le 100$ chars).App Server executes an INSERT statement into the Primary Database.Primary Database commits the record and returns the new ID.App Server invalidates the user's cache in Redis, dispatches a background indexing job to the Message Queue, and returns a 201 Created status to the client.6. ##Trade-offs & High Availability (Single Points of Failure)Key System Trade-offsEventual Consistency vs. Read Latency: Offloading reads to database replicas provides sub-20ms reads, but introduces a minor replication lag ($<100\text{ms}$). A user refreshing immediately after adding a note might see cached data briefly.Stateless App Servers vs. Sticky Sessions: Using stateless application servers requiring JWT re-validation on every request adds slight overhead, but enables effortless horizontal auto-scaling without session loss.
##Eliminating Single Points of Failure (SPOF)
App Server Failover: Deploying multiple app server instances behind an Application Load Balancer across multiple Availability Zones (AZs).

Database High Availability: Configuring automated multi-AZ primary database failover with read replicas promoted automatically if the primary instance fails.

Load Balancer & Edge Redundancy: Utilizing AWS ALB managed infrastructure paired with Cloudflare Anycast DNS to ensure automatic DDOS protection and gateway failover.
