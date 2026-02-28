# API Client and Services

## Services to Build
- API Client (axios instance with interceptors)
- Auth Service (login, register, getMe, updateProfile)
- Job Service (create, fetch, update, accept, start, complete, cancel)
- Matching Service (findWorker, getNearbyJobs)
- Review Service (submit, getUserReviews)
- Payment Service (createOrder, verify, confirmOffline, getTransactions)
- Category Service (getAll, getStats)

---

## 21st Dev Prompt

```
[PASTE PROMPT HERE]
```

---

## Implementation Notes
- Base URL: `http://localhost:5000/api`
- Add Authorization header with JWT token
- Handle errors globally with interceptors
- Retry logic for failed requests
- Request/response logging in development
