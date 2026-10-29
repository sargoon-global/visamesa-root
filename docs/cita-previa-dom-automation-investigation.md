# Cita Previa DOM Automation Investigation

## Purpose

This document records the DOM investigation for the Cita Previa booking flow from office selection through successful appointment confirmation. It is the reference specification for selector design and screen progression. It deliberately describes the current government-page behavior without implementing automation.

The objective is not merely to reach an intermediate page. A run is successful only when the final confirmation page is reached and a non-empty appointment reference is extracted.

## Scope and evidence

Reviewed snapshots:

- `/home/gs-44/projects/place.html`
- `/home/gs-44/projects/details.html`
- `/home/gs-44/projects/details_1.html`
- `/home/gs-44/projects/slotpicker.html`
- `/home/gs-44/projects/confirmation-screen2-checkedboxes.html`
- `/home/gs-44/projects/finalscreen.html`

Related but not used as the primary supplied snapshot:

- `/home/gs-44/projects/details.html` is the actual step-2 details form.
- `details_1.html` is an error page, not a details form. It contains `h3>Error</h3>` and the message `Se ha producido un error en el sistema...`.

The HTML contains dynamic anti-bot/security scripts, dynamic hidden UUID fields, cookies, and server-side state. Those values must be treated as opaque and preserved by submitting the page's existing form.

## Global selector policy

### Selector priority

Use selectors in this order:

1. Stable explicit IDs assigned to functional controls.
2. Stable semantic names, such as `name="rdbCita"`.
3. Form identity plus a stable child selector.
4. Structural/label-based extraction only where the page provides no ID.
5. Visible text only as a secondary screen-verification signal, never as the sole control selector.

Do not use:

- Generated CSS classes such as `mf-layout--module__m`, `mf-input__xl`, or `select2-container` as primary selectors.
- DOM indexes such as `forms[0]`, except where the page's own behavior requires the existing form and the form has first been scoped to the expected screen.
- Dynamic UUID hidden-field names as hardcoded identifiers.
- Captcha image contents, OCR, or any captcha-solving mechanism.
- Fixed delays or polling loops.

### Existing form state

The pages contain hidden fields with names that are UUIDs and values that represent server-side state. The automation must:

- Fill or select controls in the existing DOM.
- Trigger the relevant native/input/change events.
- Submit the existing page form or activate the page's own button behavior.
- Never construct a replacement POST body that omits hidden fields.
- Never replace or regenerate the hidden UUID values.

### Screen readiness

A screen is ready only when both the expected navigation context and its functional DOM marker are present. URL changes alone are insufficient; DOM markers alone are insufficient because partial page transitions and errors can occur.

Every transition must have:

- A positive readiness condition.
- A recognized error condition.
- A bounded failure/retry outcome.
- A safe exit path that does not claim success.

## Flow summary

```text
Step 1: Office page
  #idSede -> select office -> #btnSiguiente
  form action changes/submits to acVerFormulario

Step 2: Details page
  #txtTelefonoCitado, #emailUNO, #emailDOS -> #btnSiguiente
  form action changes/submits to acOfertarCita

Step 3: Slot page
  input[name="rdbCita"] -> manual #captcha -> #btnSiguiente
  page opens a confirmation dialog
  dialog "Sí" must be activated
  existing form submits to acVerificarCita

Step 4: Appointment confirmation page
  #chkTotal -> optional #aceptaRgpd -> #btnConfirmar
  #citadoForm submits to acGrabarCita

Step 5: Final confirmation
  #justificanteFinal + "CITA CONFIRMADA"
  extract appointment details and reference
  persist only after all success markers validate
```

## Step 1 — Office selection (`place.html`)

### Screen identity

Positive markers:

```css
select#idSede
form[name="procedimientos"]
input#btnSiguiente
```

The page displays `Paso 1 de 5` and the office label `Selecciona Oficina`.

### Controls

| Purpose | Selector | Notes |
|---|---|---|
| Office selector | `#idSede` | Native `select`; use the configured office value, not only visible text when a value is available. |
| Continue | `#btnSiguiente` | Native `input[type="button"]`; invokes the page's `enviar()` function. |
| Existing form | `form[name="procedimientos"]` | Preserve all hidden fields. |
| Validation message | `#alert_seleccion_provincia_sede` | Shown when no office is selected. |

### Progression

1. Wait for `#idSede` and `#btnSiguiente`.
2. Select the configured office option.
3. Trigger `change`.
4. Verify `#idSede.value` is non-empty.
5. Activate `#btnSiguiente`.
6. The page's `enviar()` function hides the validation message, changes the form action to `acVerFormulario`, and submits `form[name="procedimientos"]`.
7. Wait for the step-2 details marker.

The automation should not directly use the unstable hidden token names. The browser's existing form submission must carry them.

### Failure handling

If `#alert_seleccion_provincia_sede` becomes visible or contains an error message, do not advance. Report that office selection was rejected and keep the flow retryable.

## Step 2 — Contact details (`details.html`)

### Important snapshot correction

`details_1.html` is an error response and must be classified as an error screen. It must not be used to discover or drive the form controls. The actual details form is in `details.html` and is identified as `Paso 2 de 5`.

### Screen identity

Positive markers:

```css
#txtTelefonoCitado
#emailUNO
#emailDOS
form[name="procedimientos"]
input#btnSiguiente
```

Additional semantic marker:

```text
INFORMACIÓN COMPLEMENTARIA
```

### Controls

| Purpose | Selector | Notes |
|---|---|---|
| Phone | `#txtTelefonoCitado` | `input[type="tel"]`, name `txtTelefonoCitado`, required, max length 14. |
| Primary email | `#emailUNO` | `input[type="email"]`, name `txtMailCitado`, required. |
| Email confirmation | `#emailDOS` | `input[type="email"]`, name `emailDOS`, required, `noPaste`. |
| Continue | `#btnSiguiente` | Page-specific `input[type="button"]`. Scope it to the step-2 form/screen. |
| Existing form | `form[name="procedimientos"]` | Preserve hidden state fields. |

### Progression

1. Wait for all three input controls and the step-2 form.
2. Fill `#txtTelefonoCitado` with the normalized profile phone value.
3. Trigger `input` and `change` events.
4. Fill `#emailUNO` and `#emailDOS` with the same email.
5. Trigger `input` and `change` events for both.
6. Verify the values are present and the email values match case-insensitively.
7. Activate the step-2 `#btnSiguiente`.
8. The page validates the fields and changes the form action to `acOfertarCita` before submitting.
9. Wait for the slot-picker markers.

### Validation/error markers

```css
#txtTelefonoCitadoError
#emailUNOError
#emailDOSError
#divEmailUNO.error
#divEmailDOS.error
```

The flow must not advance when a required value is missing, the email values differ, the email is invalid, or a field-specific error message is populated.

## Step 3 — Slot selection and captcha (`slotpicker.html`)

This step has two separate user gates:

1. The captcha must be entered by the user.
2. Clicking `Siguiente` opens a JavaScript confirmation dialog. The booking does not proceed until the user selects `Sí`.

### Screen identity

Positive markers:

```css
input[name="rdbCita"]
#fechaSeleccionada
#txtHora
#captcha
#btnSiguiente
```

The page displays `Paso 3 de 5` and the legend `Selecciona una de las siguientes citas disponibles`.

### Appointment controls

| Purpose | Selector | Notes |
|---|---|---|
| Appointment radios | `input[name="rdbCita"]` | Use all currently rendered radios; do not hardcode `cita1`, `cita2`, or `cita3`. |
| Appointment card | `div[id^="cita_"]` | Associated visual card, for example `#cita_1`. |
| Appointment label | `label[id^="lCita_"]` | Contains displayed day and time. |
| Search date | `#fechaSeleccionada` | Text input name `txtFecha`. |
| Search time | `#txtHora` | Select input; default option is first available appointment. |
| Refresh search | `#btnEnviar` | Calls `buscarHoras()` and submits to `acOfertarCita`. |
| Continue | `#btnSiguiente` | Calls `envia()`. |
| Existing form | `form[name="procedimientos"]` | Preserve hidden state fields. |

### Appointment choice

The automation should:

1. Collect `input[name="rdbCita"]` elements.
2. For each radio, resolve its associated `label[for="..."]` or `label[id^="lCita_"]`.
3. Read the displayed date and time from the associated card.
4. Ignore radios that are disabled, unavailable, or no longer attached to the document.
5. Apply the configured choice policy, normally the earliest available date/time.
6. Check the selected radio using the DOM property, not only by setting an HTML attribute.
7. Dispatch the appropriate click/change event so the page's `coloreaSel()` behavior runs.
8. Verify that exactly one `input[name="rdbCita"]:checked` exists.

The radio value is an internal appointment choice value. The automation must not infer the appointment date from that value; it must use the visible card data for selection and later use the confirmation screen as the authoritative appointment record.

### Date/time availability refresh

If the configured date/time preference requires a new search:

1. Set `#fechaSeleccionada` and/or `#txtHora`.
2. Dispatch the native events expected by the page.
3. Activate `#btnEnviar`.
4. Wait for the page to return to the slot-picker screen.
5. Re-discover the current `input[name="rdbCita"]` elements because the server may replace the entire availability list.

Do not retain DOM element references across a refresh.

### Captcha handling

Captcha selectors:

```css
#comp19_captcha
img[alt="captcha"]
input#captcha
```

The input is:

```html
<input id="captcha" name="txtCaptcha" type="text">
```

The automation must:

- Detect the captcha screen using `#captcha` and `#comp19_captcha`.
- Keep the official WebView hidden except for the focused captcha interaction UI, according to the existing product behavior.
- Ask the user to read and enter the captcha.
- Never OCR, solve, bypass, or submit an automatically inferred captcha value.
- Wait for a user-entered non-empty value.
- Verify the value remains present immediately before continuing.

Captcha refresh control:

```css
a[title="Recargar Captcha"]
```

The refresh link invokes the page's `recargarCaptcha()` function and submits the existing form. If the user requests a refresh, wait for a new `#captcha`/captcha image state and require a new manual entry.

Captcha error marker:

```css
#comp19_captcha .error
```

Typical error text:

```text
Los caracteres escritos no son correctos.
```

If the captcha is rejected, remain retryable on step 3, do not select a new appointment unnecessarily, and do not report progress.

### Slot `Siguiente` confirmation dialog — critical behavior

The slot page's `envia()` function does not immediately submit after the button is pressed.

When `#btnSiguiente` is activated:

1. The page verifies that one `input[name="rdbCita"]:checked` exists.
2. It creates a jQuery Confirm dialog.
3. The dialog title is `VAS A RESERVAR LA CITA SELECCIONADA`.
4. The dialog content asks `¿Estás seguro?`.
5. The dialog provides buttons `Sí` and `No`.
6. Only the `Sí` callback calls `document.forms[0].submit()`.
7. The `No` callback leaves the page on step 3.

This means clicking `#btnSiguiente` is only the first half of the transition.

The automation must:

1. Verify the appointment radio is selected.
2. Verify the captcha value is non-empty and user-provided.
3. Activate `#btnSiguiente`.
4. Detect the displayed confirmation dialog.
5. Verify the dialog corresponds to the expected reservation confirmation by its title/content.
6. Activate the dialog's `Sí` button.
7. Wait for navigation to `acVerificarCita` and the step-4 confirmation marker.

It must not:

- Assume that `#btnSiguiente` caused a submission.
- Submit the form a second time after the dialog's `Sí` callback.
- Activate a generic first dialog button without verifying its title and buttons.
- Treat the dialog's appearance as a successful booking.

The dialog's `No` action is a deliberate user cancellation of this transition and must leave the flow retryable.

### Slot failure states

Recognize and handle:

- No selected radio: page alert mentioning that a citation must be selected.
- Empty/invalid captcha: captcha error state or alert.
- Dialog `No`: remain on step 3.
- Server-side error page after submission: classify as failure; do not advance or persist.

## Step 4 — Appointment confirmation (`confirmation-screen2-checkedboxes.html`)

### Screen identity

Positive markers:

```css
form#citadoForm[action="acGrabarCita"]
#chkTotal
#btnConfirmar
```

Additional marker:

```text
Paso 4 de 5
Debes confirmar los datos de la cita asignada
```

### Appointment data displayed

The supplied page displays values without unique IDs. The data is grouped under the `Datos de la Cita` fieldset:

- `Dirección`
- `Día de la cita`
- `Hora cita`
- `Mesa`

For this screen, values should be extracted by locating the field label text and reading the adjacent `.mf-psdinput` value within the same `.fld` container. Do not use global positional indexes.

### Required declarations

| Purpose | Selector | Rule |
|---|---|---|
| Main declaration | `#chkTotal` | Always required and must be checked. |
| Optional GDPR declaration | `#aceptaRgpd` | Check only when present. It is absent in the supplied snapshot. |
| Confirmation form | `#citadoForm` | Existing form must be submitted. |
| Confirm button | `#btnConfirmar` | Calls `envia()`. |
| Return button | `#btnVolver` | Must not be used by the success path. |

### Progression

1. Wait for `#citadoForm`, `#chkTotal`, and `#btnConfirmar`.
2. Extract the displayed appointment details for diagnostics, but do not treat them as final until step 5.
3. Check `#chkTotal`.
4. If `#aceptaRgpd` exists, check it.
5. Verify the required boxes are checked.
6. Activate `#btnConfirmar`.
7. The page's `envia()` function validates the declarations and submits the existing form to `acGrabarCita`.
8. Wait for the final confirmation marker.

If the main declaration is not checked, the page displays an alert and marks `#conforme` red. The automation must not force progression past this validation state.

## Step 5 — Final successful confirmation (`finalscreen.html`)

### Success markers

All of the following should be used together:

```css
#justificanteFinal
```

and visible text:

```text
CITA CONFIRMADA
```

The page displays `Paso 5 de 5` and the title `Justificante de la cita`.

### Authoritative reference

The booking reference is the text content of:

```css
#justificanteFinal
```

Example:

```html
<span id="justificanteFinal">3584AX7F</span>
```

The flow must reject success if this element is missing or blank.

### Appointment extraction

The final page is authoritative for:

- Appointment office/address.
- Appointment date.
- Appointment time.
- Desk/table, when available.
- Appointment reference code.

Use label-anchored extraction inside the `DATOS DE LA CITA` fieldset:

```text
Dirección
Día de la cita
Hora cita
Mesa
```

The page also defines a JavaScript variable named `lugar`, but DOM extraction from the visible confirmation field is preferred because it reflects the rendered server response.

### Finalization rule

Only after all success markers and required extracted values pass validation should the automation:

1. Persist the appointment record.
2. Emit a structured completion event.
3. Return to the dashboard/safe app screen.
4. Mark the requirement complete.

If the final page is reached but the reference is missing, treat it as an incomplete result requiring diagnostics rather than a successful booking.

## Navigation and readiness state machine

Recommended logical states:

```text
idle
waiting-office
submitting-office
waiting-details
submitting-details
waiting-slots
awaiting-captcha
awaiting-slot-confirmation-dialog
submitting-slot
waiting-appointment-confirmation
submitting-confirmation
waiting-final-confirmation
completed
retryable-error
fatal-error
```

### State transitions

| Current state | Required condition | Action | Next state |
|---|---|---|---|
| `waiting-office` | `#idSede`, `#btnSiguiente` | Select office and continue | `submitting-office` |
| `submitting-office` | URL/form transition | Wait for details DOM | `waiting-details` |
| `waiting-details` | Phone/email controls | Fill and continue | `submitting-details` |
| `submitting-details` | URL/form transition | Wait for slot DOM | `waiting-slots` |
| `waiting-slots` | Appointment radios and `#captcha` | Select appointment | `awaiting-captcha` |
| `awaiting-captcha` | User-entered captcha | Activate slot `#btnSiguiente` | `awaiting-slot-confirmation-dialog` |
| `awaiting-slot-confirmation-dialog` | Expected reservation dialog | Activate `Sí` | `submitting-slot` |
| `submitting-slot` | `acVerificarCita` and `#citadoForm` | Validate confirmation screen | `waiting-appointment-confirmation` |
| `waiting-appointment-confirmation` | `#chkTotal`, `#btnConfirmar` | Check declarations and confirm | `submitting-confirmation` |
| `submitting-confirmation` | `acGrabarCita` and final markers | Extract and persist | `completed` |

## URL and DOM verification

URL matching should use normalized path segments/endpoints, not exact full URLs, because query strings, deployment prefixes, and dynamic parameters may vary.

Expected endpoint markers:

```text
acVerFormulario   -> details screen
acOfertarCita     -> slot availability screen
acVerificarCita   -> appointment confirmation screen
acGrabarCita      -> final confirmation screen
```

A URL endpoint must always be paired with the screen's DOM marker. A page containing an error heading or server error message takes precedence over a nominal URL match.

## Error and recovery principles

- Never mark a booking complete before the final reference is validated.
- Preserve retryability for captcha errors, dialog cancellation, unavailable slots, and transient server errors.
- Do not silently choose another appointment after a server-side reservation error unless the user/configuration explicitly permits it.
- Avoid duplicate form submissions.
- Guard each submission and completion handler against re-entry.
- Do not use fixed delays; wait for URL and DOM events.
- Keep the official government WebView hidden except for required user captcha interaction.
- Never bypass or submit a captcha automatically.

## Selector stability assessment

### High confidence

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
#btnConfirmar
#citadoForm
#justificanteFinal
```

### Medium confidence

```text
#btnSiguiente
#btnEnviar
#comp19_captcha
#btnVolver
```

These IDs are explicit and stable in the snapshots, but `#btnSiguiente` is reused on multiple screens. It must always be scoped by screen identity and expected form.

### Low confidence / do not use as primary selectors

```text
.mf-layout--module__*
.mf-input__*
.select2-container
.mf-button.primary
.ui-datepicker-*
```

These are presentation or library classes and may change without changing page behavior.
