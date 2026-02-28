# Frontend Implementation Prompts

This folder contains markdown files with blank spaces for 21st dev prompts to generate Phase 2 frontend components.

## File Structure

1. **01-auth-components.md** - Login, Register, Phone Input
2. **02-client-dashboard.md** - Client dashboard and job creation
3. **03-worker-dashboard.md** - Worker dashboard and job management
4. **04-job-components.md** - Job cards, forms, status tracking
5. **05-review-rating.md** - Review and rating system
6. **06-payment-components.md** - Payment integration (Razorpay)
7. **07-shared-components.md** - Common UI components
8. **08-pages.md** - All page components
9. **09-context-state.md** - Context providers and state management
10. **10-api-client.md** - API services and axios setup
11. **11-utils-hooks.md** - Custom hooks and utilities
12. **12-routing-navigation.md** - React Router setup
13. **13-styling-theme.md** - TailwindCSS and DaisyUI theme
14. **14-forms-validation.md** - Form handling and validation
15. **15-error-handling.md** - Error boundaries and loading states

## How to Use

1. Open each markdown file
2. Paste the appropriate 21st dev prompt in the designated section
3. Run the prompts to generate components
4. Integrate generated code into the React app

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS + DaisyUI
- **Routing**: React Router v6
- **State**: React Context API
- **Forms**: React Hook Form
- **HTTP**: Axios
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Backend Integration

All components should integrate with the backend APIs:
- Base URL: `http://localhost:5000/api`
- Authentication: JWT tokens in Authorization header
- Endpoints: auth, jobs, matching, reviews, payments, categories
