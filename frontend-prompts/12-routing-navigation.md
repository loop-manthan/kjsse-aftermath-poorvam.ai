# Routing and Navigation

## Routing Structure
```
/                       → Landing Page
/login                  → Login Page
/register               → Register Page
/client/dashboard       → Client Dashboard (Protected)
/worker/dashboard       → Worker Dashboard (Protected)
/jobs/:jobId            → Job Details (Protected)
/profile                → User Profile (Protected)
/404                    → Not Found
```

## Protected Route Logic
- Check if user is authenticated
- Redirect to /login if not authenticated
- Check userType and redirect to appropriate dashboard
- Handle role-based access control

---

## 21st Dev Prompt

```
[PASTE PROMPT HERE]
```

---

## Implementation Notes
- Use React Router v6
- ProtectedRoute component wrapper
- Redirect logic in route guards
- Preserve intended destination after login
