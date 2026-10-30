import {APPOINTMENT_CONFIRMATION_SCRIPT} from './confirmation';
import {APPOINTMENT_FINAL_SCRIPT} from './final';
import {SLOT_PICKER_SCRIPT} from './slotpicker';

describe('Cita Previa DOM automation scripts', () => {
  it('uses the stable slot selectors and handles the reservation dialog', () => {
    expect(SLOT_PICKER_SCRIPT).toContain('input[name="rdbCita"]');
    expect(SLOT_PICKER_SCRIPT).toContain('#captcha');
    expect(SLOT_PICKER_SCRIPT).toContain('#btnSiguiente');
    expect(SLOT_PICKER_SCRIPT).toContain('VAS A RESERVAR LA CITA SELECCIONADA');
    expect(SLOT_PICKER_SCRIPT).toContain('clickDialogYes');
    expect(SLOT_PICKER_SCRIPT).not.toContain('setTimeout');
    expect(SLOT_PICKER_SCRIPT).not.toContain('setInterval');
  });

  it('checks the confirmation declarations before continuing', () => {
    expect(APPOINTMENT_CONFIRMATION_SCRIPT).toContain('#chkTotal');
    expect(APPOINTMENT_CONFIRMATION_SCRIPT).toContain('#aceptaRgpd');
    expect(APPOINTMENT_CONFIRMATION_SCRIPT).toContain('#btnConfirmar');
  });

  it('requires the final confirmation heading and reference', () => {
    expect(APPOINTMENT_FINAL_SCRIPT).toContain('#justificanteFinal');
    expect(APPOINTMENT_FINAL_SCRIPT).toContain('CITA CONFIRMADA');
    expect(APPOINTMENT_FINAL_SCRIPT).toContain('cita-previa-booking-complete');
  });
});
