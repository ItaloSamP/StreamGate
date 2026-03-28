# StreamGate Frontend Auth And Landing Design

Date: 2026-03-28
Status: Proposed and user-approved in conversation, pending final written spec review
Scope: `apps/web`

## Summary

This design introduces a complete public-to-authenticated frontend flow for StreamGate while preserving the visual identity already established in the approved dashboard prototype.

The implementation will focus on:

- a cleaner, more product-oriented landing page
- responsive login, registration, and password reset screens
- simulated frontend-only authentication for this phase
- route protection so the dashboard is available only to authenticated users
- logout from the dashboard profile area
- restrained motion, hover polish, and subtle skeleton states

Backend integration is explicitly out of scope for this phase. The goal is to ship high-quality, production-looking screens and navigation flows first, while keeping the structure ready for later auth integration.

## Goals

- Preserve the current dashboard visual language and make every new screen feel like part of the same product.
- Create dedicated screens for login, registration, password reset, landing page, and protected dashboard access.
- Ensure all screens are responsive and usable on desktop and mobile.
- Provide clear validation and feedback for form errors and success states.
- Add lightweight interaction polish without making the UI visually noisy.
- Keep the app ready for future replacement of mock auth with real backend auth.

## Non-Goals

- Real API integration for login, registration, password reset, or logout.
- E-mail delivery or token-based password reset flows.
- Role-based access control.
- Multi-factor authentication.
- Persistent user profiles beyond the mock session.

## Product Direction

The visual direction should keep the dashboard as the source of truth for the product identity.

Design principles:

- dark operational shell with restrained accent colors
- dense but readable panels
- clear typography hierarchy
- premium B2B product tone instead of consumer app styling
- landing page inspired by polished crypto-style product marketing, but cleaner and less flashy
- subtle blur, hover, and skeleton motion only where it strengthens hierarchy and affordance

The public experience should feel like a controlled front door to the same system shown in the dashboard preview, not like a disconnected marketing site.

## Routes

The frontend should expose the following routes:

- `/` for the public landing page
- `/login` for authentication entry
- `/register` for account creation
- `/reset-password` for password redefinition
- `/dashboard` for the authenticated workspace

Behavior rules:

- unauthenticated users attempting to access `/dashboard` are redirected to `/login`
- authenticated users can access `/dashboard`
- logout clears the simulated session and redirects to `/`

## Authentication Model For This Phase

This phase uses simulated frontend-only authentication.

Session behavior:

- successful login creates a mock authenticated session
- if the user selects `remember login`, the session is stored in `localStorage`
- if the user does not select `remember login`, the session is stored in `sessionStorage`
- on app boot, the frontend checks for an existing mock session and restores access if present

The implementation should keep auth state isolated enough that later replacement with real backend auth does not require redesigning the page structure or navigation rules.

## Screen Designs

### Landing Page

The landing page should be simplified and aligned more closely with the dashboard prototype.

Requirements:

- clean up the current page so it feels less crowded
- keep a strong dashboard preview on the page
- apply blur and lock treatment to the dashboard preview so it communicates restricted access
- include a primary CTA: `Acesse sua dashboard`
- route the primary CTA to `/login`
- add a secondary product-discovery path for learning about the platform
- include a section equivalent to `saiba sobre nós`
- explain what the platform does and what it offers to companies
- highlight relevant StreamGate capabilities such as observability, secure ingestion, pipeline control, auditability, and operational visibility
- ensure the landing page still feels connected to the dashboard rather than becoming a generic marketing page

Suggested content structure:

1. Hero with brand, value proposition, CTA, and dashboard preview
2. Capabilities section focused on what StreamGate enables for businesses
3. Operational benefits section focused on governance, monitoring, and secure workflows
4. Closing CTA that routes users to the login flow

### Login

The login page should be a dedicated screen rather than a card on the landing page.

Requirements:

- fields for e-mail and password
- checkbox for `remember login`
- link to password reset
- visible button or link to registration
- successful login redirects to `/dashboard`
- visual language must match the approved prototype and dashboard identity
- dashboard entry points should route here rather than bypass auth

UX expectations:

- desktop layout may use a split composition with product context on one side and the form on the other
- mobile layout should stack cleanly with no loss of clarity
- focus, hover, invalid, and loading states must feel polished and accessible

### Registration

The registration page should follow the same shell and visual language as login.

Fields:

- full name
- birth date
- corporate e-mail
- password
- password confirmation

Validation rules:

- all fields are required
- e-mail must be a valid e-mail format
- corporate e-mail, for this phase, accepts any syntactically valid e-mail address
- password must contain at least one number
- password must contain at least one uppercase letter
- password must be at most 8 characters long
- password confirmation must exactly match the password

Feedback rules:

- inline field feedback should appear where appropriate
- a toast should also communicate submission errors
- if multiple errors are submitted in sequence, the newest toast replaces the previous one instead of stacking
- successful registration redirects the user to `/login`
- successful registration should show a success toast on or after redirect

### Password Reset

The password reset screen should visually belong to the same family as login and registration.

Fields:

- e-mail
- new password
- confirm new password

Validation rules:

- e-mail must be valid
- password uses the same rules as registration
- confirmation must match

Behavior:

- reset submission is simulated in the frontend
- successful completion redirects the user back to `/login`
- a success toast should confirm completion

### Dashboard

The dashboard already has an approved design direction and should remain the visual anchor of the system.

Requirements for this phase:

- move the current dashboard experience into its own protected route
- preserve the visual identity already approved by the user
- add a profile entry point that exposes logout
- ensure logout returns the user to the landing page

The dashboard must not be directly accessible to unauthenticated users.

## Responsiveness

All screens must be responsive.

Requirements:

- mobile-first handling for auth screens
- dashboard preview remains strong on small screens without becoming visually overwhelming
- no critical action should disappear on smaller breakpoints
- spacing, typography, and panel density should adapt cleanly across common widths
- forms must remain easy to scan and submit on touch devices

## Motion And Interaction Polish

The user requested life and quality in the interface, but not flashy behavior.

Allowed polish:

- subtle hover elevation or surface shifts
- restrained blur transitions
- gentle skeleton shimmer for preview or blocked states
- small loading transitions on submit actions
- controlled opacity or translate transitions during screen changes and state changes

Constraints:

- no exaggerated animation
- no distracting motion loops
- no overly bright or attention-seeking effects

## Validation And Feedback Model

The feedback model should be consistent across forms.

Requirements:

- inline field validation for clarity
- single global toast surface
- a new toast replaces the current one instead of stacking on top of it
- success and error states use the same visual system as the rest of the product
- form submission buttons should expose loading or disabled states while processing simulated actions

## Information Architecture And Components

To avoid a monolithic `App.tsx`, the frontend should be reorganized into pages, auth state, guards, and reusable UI blocks.

Suggested structure:

- route-level pages for landing, login, registration, reset password, and dashboard
- auth context or equivalent centralized session state
- route guard for protected pages
- shared auth layout shell for login/register/reset
- reusable form field and feedback primitives
- global toast component
- dashboard profile/logout menu
- reusable locked-preview and skeleton states for the landing page

This structure is meant to support the current prototype-first phase while making later backend integration easier.

## Testing Strategy

Implementation should follow TDD for behavior-oriented logic.

Priority test targets:

- validation helpers for registration and password reset
- login validation behavior
- route guard behavior for `/dashboard`
- session persistence differences between remembered and non-remembered login
- logout behavior clearing session and redirecting correctly

Visual styling itself does not need exhaustive test coverage, but the interaction and state logic should be covered.

## Risks And Mitigations

### Risk: Landing page becomes visually disconnected from dashboard

Mitigation:

- reuse dashboard materials, spacing language, accent usage, and preview treatment
- make the dashboard preview the dominant visual anchor of the hero

### Risk: Auth screens feel generic

Mitigation:

- use a shared auth shell derived from the dashboard identity
- avoid default card-only forms with no surrounding product context

### Risk: Mock auth becomes tightly coupled to page logic

Mitigation:

- isolate session state and guard behavior from page presentation
- keep session read/write behavior behind helpers

### Risk: Responsive layouts lose clarity on smaller devices

Mitigation:

- design auth screens mobile-first
- verify hierarchy and CTA prominence across mobile and desktop widths

## Acceptance Criteria

- The app has dedicated routes for landing, login, registration, password reset, and dashboard.
- The dashboard is only accessible when a mock authenticated session exists.
- Login supports e-mail, password, remember-login, and navigation to registration and password reset.
- Registration validates full name, birth date, e-mail, password, and password confirmation.
- Password rules are enforced exactly as requested: maximum 8 characters, at least 1 number, and at least 1 uppercase letter.
- Password reset uses the same password rules and returns the user to login after success.
- Logout is available from the dashboard profile area and returns the user to the landing page.
- The landing page is visually cleaner than the current version while preserving dashboard identity.
- All screens are responsive.
- Toasts do not stack; the newest toast replaces the current one.
- The UI includes restrained hover, skeleton, and transition polish without becoming visually noisy.

## Open Decisions Resolved In Conversation

- Auth implementation for this phase: frontend-only simulated auth
- Corporate e-mail validation for this phase: any valid e-mail format is accepted
- Primary focus: screens, environments, responsiveness, and user experience

## Next Step

After written spec approval, the next step is implementation planning and then frontend execution in `apps/web`.
