# Cita Previa DOM Automation Implementation Plan

## Status

Planning only. No automation code is implemented by this document.

## Goal

Implement a robust, event-driven Cita Previa automation that progresses from office selection to a verified successful appointment booking, while preserving server state, keeping captcha interaction manual, and avoiding false-positive completion.

## Branch

Implementation branch:

```text
feat/cita-previa-dom-automation
```

The branch is based on the current empadronamiento-native-status-confirmation branch at the time of planning.

## Implementation boundaries

### Included

- DOM-driven Cita Previa screen detection.
- Office selection.
- Contact form filling and validation.
- Appointment discovery and selection.
- Manual captcha handoff and retry handling.
- Slot confirmation dialog handling (`Sí`/`No`).
- Confirmation declaration handling.
- Final success validation and appointment extraction.
- Tests for selectors, screen detection, dialog behavior, errors, and completion persistence.

### Excluded

- Captcha solving, OCR, bypass, or automatic captcha submission.
- Government endpoint/API reimplementation.
- Reconstructing POST bodies outside the existing page forms.
- Fixed-delay navigation loops.
- Changes to unrelated Modelo 790 or empadronamiento flows.
- Changing final dashboard behavior unless required to consume the already structured appointment result.

## Proposed architecture

### 1. Screen classifier

Create a small pure classifier that receives the current URL and DOM probe results and returns a typed screen state.

Example conceptual states:

```ts
type CitaPreviaScreen =
  | 'office'
  | 'details'
  | 'slots'
  | 'appointment-confirmation'
  | 'final-confirmation'
  | 'error'
  | 'unknown';
```

The classifier should require both URL and DOM evidence where possible. It should detect server error pages before accepting a normal screen.

### 2. Per-screen actions

Keep each screen's selectors and actions isolated:

```text
cita-previa/
  screenDetection.ts
  selectors.ts
  office.ts
  details.ts
  slots.ts
  appointmentConfirmation.ts
  finalConfirmation.ts
  types.ts
```

The actual file names should follow the repository's existing Cita Previa script conventions after reviewing the current implementation.

### 3. Shared DOM helpers

Use small helpers for:

- Safe CSS querying.
- Scoped form lookup.
- Native value assignment with input/change events.
- Checking a checkbox through the DOM property.
- Reading normalized text.
- Waiting for a DOM readiness marker through URL/navigation events already available in the WebView layer.
- Detecting visible validation messages.
- Finding and validating the slot confirmation dialog.

Helpers should return explicit success/failure results instead of throwing for expected validation states.

### 4. Typed result model

Use a typed result model for each action:

```ts
type AutomationActionResult<T> =
  | {ok: true; value: T}
  | {ok: false; kind: 'not-ready' | 'validation' | 'user-cancelled' | 'server-error' | 'invalid-dom'; message: string};
```

This keeps expected retryable states distinct from unexpected failures.

## Detailed execution plan

### Phase 1 — Confirm source and current implementation

Before changing code:

1. Inspect the current Cita Previa script registry and injection rules.
2. Identify existing `/acOpciones` and `/acVerFormulario` logic.
3. Identify current URL matching and readiness behavior.
4. Identify existing message formats sent from injected JavaScript to React Native.
5. Confirm the exact route/profile fields used for office, phone, email, date/time preferences, and completion persistence.
6. Compare the supplied HTML snapshots with the live DOM shape used by the current implementation.

Deliverable: a mapping from existing script entry points to the planned per-screen actions.

### Phase 2 — Add selector constants and screen probes

Define selector constants for the high-confidence controls:

```text
#idSede
#txtTelefonoCitado
#emailUNO
#emailDOS
input[name="rdbCita"]
#fechaSeleccionada
#txtHora
#captcha
#chkTotal
#aceptaRgpd
#btnConfirmar
#citadoForm
#justificanteFinal
```

Add screen probes for:

- Office screen.
- Details screen.
- Slot screen.
- Confirmation screen.
- Final screen.
- Error screen.

Do not use page indexes or dynamic hidden UUID names.

### Phase 3 — Implement office step

Behavior:

1. Wait for `#idSede`.
2. Select the configured office by option value when possible.
3. Dispatch `change`.
4. Verify the selected value.
5. Activate the screen-scoped `#btnSiguiente`.
6. Wait for `acVerFormulario` plus details controls.
7. Report a retryable validation error if `#alert_seleccion_provincia_sede` is visible.

### Phase 4 — Implement details step

Behavior:

1. Confirm that the page is the real details screen, not the `details_1.html` server error shape.
2. Fill `#txtTelefonoCitado`.
3. Fill `#emailUNO` and `#emailDOS`.
4. Dispatch input/change events.
5. Validate values before submission.
6. Activate the details `#btnSiguiente`.
7. Wait for `acOfertarCita` plus slot controls.
8. Surface field-level messages from `#txtTelefonoCitadoError`, `#emailUNOError`, and `#emailDOSError`.

### Phase 5 — Implement slot discovery and selection

Behavior:

1. Wait for `input[name="rdbCita"]`.
2. Parse each appointment card's displayed date/time from its associated label.
3. Apply the configured appointment policy.
4. Select one radio and verify `input[name="rdbCita"]:checked`.
5. If searching for another date/time, use `#fechaSeleccionada`, `#txtHora`, and `#btnEnviar`, then rediscover all controls after the server response.
6. Never retain stale element references after a refresh.

### Phase 6 — Implement manual captcha handoff

Behavior:

1. Detect `#comp19_captcha` and `#captcha`.
2. Emit a typed `captcha-required` event to the native layer.
3. Show only the required captcha interaction UI.
4. Leave captcha entry to the user.
5. Receive the user-entered value through the existing approved interaction path.
6. Insert the user value into `#captcha` and dispatch the appropriate input/change event.
7. Verify the field is non-empty.
8. If captcha validation fails, emit a retryable captcha error and remain on the slot screen.

No captcha image interpretation or automatic solving will be implemented.

### Phase 7 — Handle the slot confirmation dialog

This phase is mandatory and must not be skipped.

After the selected slot and manual captcha are ready:

1. Activate `#btnSiguiente`.
2. Do not assume submission occurred.
3. Detect the jQuery Confirm dialog.
4. Validate the dialog title/content:
   - `VAS A RESERVAR LA CITA SELECCIONADA`
   - `¿Estás seguro?`
5. Find the dialog's `Sí` action using a scoped dialog selector and normalized button text.
6. Activate `Sí` exactly once.
7. Treat `No` as `user-cancelled`; remain retryable on step 3.
8. Wait for `acVerificarCita` and `#citadoForm`.

The implementation must guard against duplicate activation because both the button handler and WebView navigation callbacks may run close together.

### Phase 8 — Implement appointment confirmation

Behavior:

1. Detect `#citadoForm` and `#chkTotal`.
2. Extract displayed appointment information for diagnostics.
3. Check `#chkTotal`.
4. Check `#aceptaRgpd` only when present.
5. Verify checkbox properties are checked.
6. Activate `#btnConfirmar`.
7. Wait for `acGrabarCita` and the final success markers.
8. If the page reports missing declarations, remain retryable and do not persist completion.

### Phase 9 — Implement final success extraction

Behavior:

1. Require `#justificanteFinal`.
2. Require a non-empty normalized reference code.
3. Require the `CITA CONFIRMADA` marker.
4. Extract address, date, time, and desk using label-anchored field extraction.
5. Validate the extracted record.
6. Emit one idempotent completion message.
7. Persist the appointment only after validation succeeds.
8. Exit safely to the dashboard after persistence.

## Event and readiness design

Use existing WebView events:

- Navigation state changes.
- Page load completion.
- Native WebView messages.
- DOM-ready/injection completion messages.

The automation should not use:

```text
setInterval polling
recursive DOM polling
arbitrary 500ms/1000ms delays
```

If a page requires a DOM marker after navigation, the injection should run on the relevant navigation/load event and report whether the marker was found.

## Error taxonomy

Expected retryable errors:

- Office missing or rejected.
- Phone/email validation failure.
- No available appointment.
- Captcha required.
- Captcha rejected.
- Slot confirmation dialog cancelled.
- Appointment confirmation checkbox missing.
- Temporary government server error.
- Unexpected page shape with recoverable retry.

Terminal or user-visible failures:

- Trusted-host rejection.
- Malformed automation payload.
- Missing required completion route metadata.
- Final page without a reference code.
- Persistence failure after a verified booking.

A verified booking with persistence failure must be reported distinctly so the user is not encouraged to book again and accidentally create a duplicate appointment.

## Idempotency and duplicate-submission protection

Implement guards for:

- Office submit.
- Details submit.
- Slot `Sí` confirmation.
- Confirmation submit.
- Completion persistence.

The guards must reset when the flow enters a new screen or when a retryable error is explicitly acknowledged.

Never submit the slot form both through the dialog callback and a separate automation callback.

## Testing plan

### Unit tests

Test pure helpers for:

- Screen classification.
- URL normalization.
- Appointment card date/time parsing.
- Earliest appointment selection.
- Checkbox presence rules.
- Label-anchored value extraction.
- Final success validation.
- Error-page detection.

### DOM/injection tests

Use representative fixtures derived from the supplied HTML to test:

- Office selection and form preservation.
- Details input filling and event dispatch.
- Slot radio discovery without hardcoded radio IDs.
- Captcha handoff without solving.
- Dialog detection and `Sí`/`No` behavior.
- Confirmation checkbox handling with and without `#aceptaRgpd`.
- Final reference extraction.

### Integration tests

Cover:

1. Complete happy path through final confirmation.
2. Missing office.
3. Invalid contact data.
4. No slot selected.
5. Captcha required.
6. Captcha rejected and retried.
7. Slot dialog `No`.
8. Slot dialog `Sí` followed by `acVerificarCita`.
9. Missing GDPR checkbox versus present GDPR checkbox.
10. Server error page at each transition.
11. Duplicate completion messages.
12. Persistence failure after successful booking.
13. Malformed WebView messages.
14. Untrusted host messages.

### Device validation

On a real device:

1. Confirm each screen is recognized from URL plus DOM.
2. Confirm the official WebView remains hidden except captcha interaction.
3. Enter captcha manually.
4. Verify the slot dialog appears and `Sí` progresses exactly once.
5. Verify the confirmation checkboxes are checked.
6. Verify the final reference and appointment details are displayed in the dashboard.
7. Test captcha rejection and retry.
8. Test selecting `No` in the slot dialog.

## Observability and diagnostics

Log only non-sensitive diagnostics. Do not log:

- Captcha values.
- Full personal data.
- Email addresses.
- Telephone numbers.
- Hidden security token values.
- Full page HTML in production.

Safe diagnostics include:

- Logical screen/state.
- Normalized endpoint name.
- Selector readiness booleans.
- Error category.
- Whether a dialog was detected.
- Whether the final reference was present, without logging the reference itself unless existing product policy permits it.

## Implementation order

1. Confirm current Cita Previa code paths.
2. Add typed selector and screen-state definitions.
3. Add screen classifiers and fixture tests.
4. Implement office and details actions.
5. Implement slot discovery/selection.
6. Implement manual captcha handoff.
7. Implement and test the slot confirmation dialog.
8. Implement confirmation checkbox flow.
9. Implement final extraction and completion persistence.
10. Add integration coverage.
11. Run type-check, lint, tests, and shared-content tests.
12. Perform manual device verification with a user-entered captcha.

## Definition of done

The implementation is complete only when:

- The flow reaches the final confirmation page in device testing.
- The slot confirmation dialog is handled correctly.
- Captcha remains manual.
- No fixed-delay or polling-based progression is introduced.
- Dynamic hidden fields remain intact.
- Retryable failures remain retryable.
- The final reference and appointment details are extracted and persisted.
- Duplicate submissions are prevented.
- Unit, DOM, integration, and relevant existing tests pass.
