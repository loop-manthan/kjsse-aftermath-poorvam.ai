# Payment Components

## Components to Build
- Payment Mode Selection (Online/Offline)
- Razorpay Integration Component
- Payment Confirmation Screen
- Transaction History
- Tip Input Component

---

## 21st Dev Prompt

```
[PASTE PROMPT HERE]
```

---

## Implementation Notes
- Integrate with `/api/payments/create-order` for Razorpay
- Use `/api/payments/verify` for payment verification
- Handle offline payment confirmation via `/api/payments/confirm-offline`
- Show transaction history from `/api/payments/transactions`
- Allow tip addition for workers
