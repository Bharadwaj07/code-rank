# CodeRank - One Pager

## 1. Project: CodeRank

A scalable code execution platform that allows users to submit, compile, and execute code in multiple programming languages through REST APIs. The system provides isolated, secure, and concurrent code execution with proper resource management and timeout handling.

---

## 2. System Design

### Architecture Overview

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────────┐
│         API Gateway / Load Balancer     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│          API Service Layer               │
│  ┌────────────────────────────────────┐  │
│  │  - Authentication & Authorization  │  │
│  │  - Rate Limiting                   │  │
│  │  - Request Validation              │  │
│  └────────────────────────────────────┘  │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│      Execution Orchestrator Service      │
│  ┌────────────────────────────────────┐  │
│  │  - Queue Management                │  │
│  │  - Resource Allocation             │  │
│  │  - Execution Coordination          │  │
│  └────────────────────────────────────┘  │
└──────────┬─────────────────┬─────────────┘
           │                 │
           ▼                 ▼
┌──────────────────┐  ┌────────────────┐
│  Message Queue   │  │    Database    │
│   (Redis/Kafka)  │  │  (PostgreSQL)  │
└──────────┬───────┘  └────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│         Execution Workers Pool           │
│  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │ Worker │  │ Worker │  │ Worker │ ... │
│  │   1    │  │   2    │  │   3    │     │
│  └────────┘  └────────┘  └────────┘     │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│      Container Runtime (Docker)          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Python   │  │   Java   │  │  C++   │ │
│  │Container │  │Container │  │Container│ │
│  └──────────┘  └──────────┘  └────────┘ │
└──────────────────────────────────────────┘
```

### Key Components

1. **API Gateway/Load Balancer**: Routes incoming requests, handles SSL termination, and distributes load across API service instances.

2. **API Service Layer**: Handles authentication, authorization, rate limiting, and request validation. Exposes RESTful endpoints for code submission and result retrieval.

3. **Execution Orchestrator**: Manages execution lifecycle, queues requests, allocates resources, and coordinates between workers.

4. **Message Queue**: Decouples API layer from execution workers, enabling asynchronous processing and horizontal scalability.

5. **Database**: Stores user data, code snippets, execution metadata, and configurations.

6. **Execution Workers**: Pull jobs from the queue, spawn containerized environments, execute code with resource limits, and return results.

7. **Container Runtime**: Provides isolated, sandboxed environments for each language with CPU/memory limits and network restrictions.

---

## 3. Database Design

### Users Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    rate_limit_tier VARCHAR(20) DEFAULT 'basic'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Code Submissions Table
```sql
CREATE TABLE code_submissions (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    language VARCHAR(20) NOT NULL,
    source_code TEXT NOT NULL,
    input_data TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_started_at TIMESTAMP,
    execution_completed_at TIMESTAMP
);

CREATE INDEX idx_submissions_user_id ON code_submissions(user_id);
CREATE INDEX idx_submissions_status ON code_submissions(status);
CREATE INDEX idx_submissions_submitted_at ON code_submissions(submitted_at DESC);
```

### Execution Results Table
```sql
CREATE TABLE execution_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID UNIQUE NOT NULL REFERENCES code_submissions(submission_id) ON DELETE CASCADE,
    stdout TEXT,
    stderr TEXT,
    compilation_error TEXT,
    runtime_error TEXT,
    execution_time_ms INTEGER,
    memory_used_kb INTEGER,
    exit_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_results_submission_id ON execution_results(submission_id);
```

### Rate Limit Tracking Table
```sql
CREATE TABLE rate_limit_tracking (
    tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL
);

CREATE INDEX idx_rate_limit_user_window ON rate_limit_tracking(user_id, window_end);
```

### Language Configurations Table
```sql
CREATE TABLE language_configs (
    language_id VARCHAR(20) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    docker_image VARCHAR(255) NOT NULL,
    compile_command TEXT,
    execute_command TEXT NOT NULL,
    timeout_seconds INTEGER DEFAULT 10,
    max_memory_mb INTEGER DEFAULT 256,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Key APIs

### **Endpoint:** `POST /api/v1/auth/register`
- **Method:** POST
- **Description:** Register a new user account.
- **Request:**
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response:** 201 Created
  ```json
  {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "message": "User registered successfully"
  }
  ```

### **Endpoint:** `POST /api/v1/auth/login`
- **Method:** POST
- **Description:** Authenticate user and receive JWT token.
- **Request:**
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
  ```

### **Endpoint:** `POST /api/v1/execute`
- **Method:** POST
- **Description:** Submit code for execution. Returns a submission ID for tracking.
- **Headers:** `Authorization: Bearer <token>`
- **Request:**
  ```json
  {
    "language": "python",
    "source_code": "print('Hello, World!')\nprint(sum([1, 2, 3, 4, 5]))",
    "input": ""
  }
  ```
- **Response:** 202 Accepted
  ```json
  {
    "submission_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "queued",
    "message": "Code submitted successfully"
  }
  ```

### **Endpoint:** `GET /api/v1/execute/{submission_id}`
- **Method:** GET
- **Description:** Retrieve execution result for a specific submission.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** 200 OK
  ```json
  {
    "submission_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "completed",
    "language": "python",
    "stdout": "Hello, World!\n15\n",
    "stderr": "",
    "compilation_error": null,
    "runtime_error": null,
    "execution_time_ms": 45,
    "memory_used_kb": 8192,
    "exit_code": 0,
    "submitted_at": "2025-12-30T10:30:00Z",
    "completed_at": "2025-12-30T10:30:01Z"
  }
  ```

### **Endpoint:** `GET /api/v1/execute/{submission_id}` (Error Case)
- **Method:** GET
- **Description:** Retrieve execution result when execution failed.
- **Response:** 200 OK
  ```json
  {
    "submission_id": "123e4567-e89b-12d3-a456-426614174001",
    "status": "failed",
    "language": "java",
    "stdout": "",
    "stderr": "",
    "compilation_error": "Main.java:5: error: ';' expected\n    System.out.println(\"Hello\")\n                                ^\n1 error",
    "runtime_error": null,
    "execution_time_ms": 0,
    "memory_used_kb": 0,
    "exit_code": 1
  }
  ```

### **Endpoint:** `GET /api/v1/languages`
- **Method:** GET
- **Description:** List all supported programming languages.
- **Response:** 200 OK
  ```json
  {
    "languages": [
      {
        "language_id": "python",
        "display_name": "Python 3.11",
        "timeout_seconds": 10,
        "max_memory_mb": 256
      },
      {
        "language_id": "java",
        "display_name": "Java 17",
        "timeout_seconds": 15,
        "max_memory_mb": 512
      },
      {
        "language_id": "javascript",
        "display_name": "Node.js 20",
        "timeout_seconds": 10,
        "max_memory_mb": 256
      },
      {
        "language_id": "cpp",
        "display_name": "C++ 17",
        "timeout_seconds": 15,
        "max_memory_mb": 512
      }
    ]
  }
  ```

### **Endpoint:** `GET /api/v1/submissions`
- **Method:** GET
- **Description:** Get user's submission history with pagination.
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `?page=1&limit=20`
- **Response:** 200 OK
  ```json
  {
    "submissions": [
      {
        "submission_id": "123e4567-e89b-12d3-a456-426614174000",
        "language": "python",
        "status": "completed",
        "submitted_at": "2025-12-30T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
  ```

---

## 5. Overall Approach

### Technology Stack

**Backend Framework:** Node.js with Express
- **Rationale:** Non-blocking I/O architecture makes it ideal for handling concurrent API requests. Large ecosystem and excellent performance for I/O-bound operations like queuing and database interactions.

**Database:** PostgreSQL
- **Rationale:** ACID compliance ensures data integrity for user accounts and execution records. Rich indexing capabilities support efficient queries for submission history and rate limiting. JSON support allows flexible storage of execution metadata.

**Message Queue:** Redis (with Bull queue library)
- **Rationale:** High-performance in-memory data store perfect for job queuing. Bull provides robust queue management with features like job prioritization, delayed jobs, and retry mechanisms. Simpler to deploy and maintain than Kafka for this use case.

**Container Runtime:** Docker
- **Rationale:** Industry-standard containerization provides strong isolation between executions. Supports resource limits (CPU, memory) natively. Easy to create and manage language-specific images.

**Authentication:** JWT (JSON Web Tokens)
- **Rationale:** Stateless authentication scales horizontally without session storage. Tokens can carry user claims for authorization. Industry standard with broad library support.

**API Rate Limiting:** Express Rate Limit + Redis
- **Rationale:** Prevents abuse and ensures fair resource allocation. Redis-backed rate limiting works across multiple API service instances.

### Design Patterns & Principles

**1. Asynchronous Processing Pattern**
- Code execution is decoupled from API requests using a message queue.
- Benefits: API responds immediately, handles traffic spikes, enables independent scaling of API and execution layers.

**2. Worker Pool Pattern**
- Multiple worker processes pull jobs from the queue concurrently.
- Benefits: Efficient resource utilization, fault tolerance (if one worker fails, others continue), easy horizontal scaling.

**3. Container-per-Execution Model**
- Each code submission runs in its own ephemeral Docker container.
- Benefits: Strong isolation prevents interference between executions, resource limits per container, automatic cleanup after execution.

**4. Microservices Architecture (Optional Future Enhancement)**
- Can separate API service, execution orchestrator, and workers into independent services.
- Benefits: Independent deployment, technology flexibility, better fault isolation.

### Security Measures

1. **Sandboxing:** Docker containers run with restricted capabilities, no host filesystem access, and limited network access.

2. **Resource Limits:** Each container enforces CPU and memory limits to prevent resource exhaustion attacks.

3. **Timeout Enforcement:** All executions are terminated after exceeding predefined time limits.

4. **Input Validation:** Strict validation of language selection, code size limits, and input data.

5. **Authentication & Authorization:** JWT-based authentication ensures only authorized users can submit code and view their results.

6. **Rate Limiting:** Per-user rate limits prevent abuse and ensure fair usage across all users.

### Scalability Strategy

**Horizontal Scaling:**
- API service layer can run multiple instances behind a load balancer.
- Worker pool can scale by adding more worker instances.
- Redis and PostgreSQL can be configured for high availability with replication.

**Adding New Languages:**
- Create new Docker image with language runtime.
- Add language configuration to `language_configs` table.
- Workers automatically support new languages without code changes.

**Performance Optimizations:**
- Connection pooling for database and Redis.
- Docker image caching to reduce container startup time.
- Warm container pools (future enhancement) to eliminate cold starts.

### Monitoring & Observability

1. **Logging:** Structured logging for all API requests, executions, and errors using Winston or Pino.

2. **Metrics:** Track execution times, queue lengths, success/failure rates, resource usage.

3. **Health Checks:** API and worker health endpoints for load balancer and orchestration tools.

4. **Alerting:** Notifications for high failure rates, queue backlogs, or resource exhaustion.

---

## Summary

CodeRank provides a secure, scalable platform for executing user-submitted code across multiple programming languages. By leveraging Docker for isolation, Redis for asynchronous job processing, and PostgreSQL for reliable data storage, the system handles concurrent executions efficiently while maintaining security and performance. The architecture supports horizontal scaling and is designed for easy extension with new programming languages.
