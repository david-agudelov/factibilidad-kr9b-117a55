# Requirements - Factibilidad Live Modeler

## Functional Requirements

- The app must support live calculations without a submit button.
- The primary editable controls must be `floors` and `floorHeight`.
- Fixed lot data must be displayed as information, not as sliders.
- Normative setbacks and lateral thresholds must be derived, not manually edited.
- Metrics must always come from derived geometry and normative state.
- The project must be built by stages, validating each module before moving forward.

## Non-Functional Requirements

- The interface must remain usable on desktop and mobile.
- The app must not show horizontal overflow at supported breakpoints.
- The codebase must keep calculation engines separate from React UI.
- TypeScript types must describe project data, editable inputs, geometry, metrics, and validation.
- Tests must cover pure engines before UI integration.

## Current V1 Constraints

- No database is required.
- No migrations are required.
- No external API is required.
- No Rhino/Grasshopper integration is required.
- The case is based on simplified rectangular lot geometry for KR9B_117A55.

## Validation Requirements

Before finalizing a change:

- `npm test` must pass.
- `npm run lint` must pass.
- `npm run build` must pass.
- Browser verification is required for UI changes.
- Fixed lot data must not appear as sliders.
- Derived normative values must not appear as editable inputs.
