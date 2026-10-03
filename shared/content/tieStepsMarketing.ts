export const HOW_TO_NAME = 'How to get your student TIE in Barcelona, Spain'

export const HOW_TO_DESCRIPTION =
  'Official path for the tarjeta de identidad de extranjero: empadronamiento, EX-17, cita previa fingerprint appointment, Modelo 790 payment, police appointment, and TIE pickup.'

export const tieSteps = [
  {
    id: 1,
    title: 'Empadronamiento in Barcelona',
    description: 'Register your address (padrón) at the Ajuntament before your TIE appointment.',
  },
  {
    id: 2,
    title: 'EX-17 TIE application form',
    description: 'Complete the EX-17 solicitud de tarjeta de extranjero for your Barcelona TIE.',
  },
  {
    id: 3,
    title: 'Cita previa toma de huellas',
    description: 'Book a fingerprint appointment (toma de huellas) on the official Policía Nacional site.',
  },
  {
    id: 4,
    title: 'Modelo 790 TIE fee (código 012)',
    description: 'Pay the government TIE issuance fee with Modelo 790 código 012 before your appointment.',
  },
  {
    id: 5,
    title: 'Toma de huellas appointment day',
    description: 'Bring EX-17, empadronamiento, Modelo 790 receipt, and passport to your cita previa.',
  },
  {
    id: 6,
    title: 'Pick up your TIE card',
    description: 'Collect your tarjeta de identidad de extranjero at the police office with your resguardo.',
  },
] as const;

/** FAQ content mirrored from the mobile app step data for SEO / JSON-LD. */
export const tieStepFaqs = [
  {
    question: 'Do I need an appointment for empadronamiento?',
    answer: 'Often yes — check your local Ayuntamiento.',
  },
  {
    question: 'Can I use a rental contract alone for empadronamiento?',
    answer: 'No — you need the official empadronamiento certificate.',
  },
  {
    question: "What if I don't have a rental contract?",
    answer: 'Your landlord may need to come with you to the Ayuntamiento.',
  },
  {
    question: 'Can someone book my cita previa on my behalf?',
    answer: 'Yes, but you must attend in person.',
  },
  {
    question: 'What if no cita previa appointments are available?',
    answer: 'Keep checking regularly; slots open at unpredictable times.',
  },
  {
    question: 'Can I pay the Modelo 790 fee later?',
    answer: 'No — bring proof of payment to your fingerprint appointment.',
  },
  {
    question: 'Which banks accept Modelo 790 code 012?',
    answer: 'Most major Spanish banks — you do not need an account.',
  },
  {
    question: 'Do they issue the TIE on the spot?',
    answer: 'No — you collect it later with your resguardo.',
  },
  {
    question: 'Can someone else pick up my TIE?',
    answer: 'Usually you must be present.',
  },
] as const;
