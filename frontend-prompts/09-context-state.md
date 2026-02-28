# Context and State Management

## Context Providers to Build
- AuthContext (user, token, login, logout, register)
- JobContext (jobs, createJob, updateJob, fetchJobs)
- NotificationContext (toast notifications)

---

## 21st Dev Prompt

```
[PASTE PROMPT HERE]
```

---

## Implementation Notes
- Use React Context API
- Store auth token in localStorage
- Persist user data across page reloads
- Provide global state for jobs and notifications
- Handle token expiration and auto-logout
