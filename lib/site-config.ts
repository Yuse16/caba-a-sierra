// TODO: reemplazar con el número confirmado por el cliente antes de la entrega final
const temporaryContactNumber = "528441234567"

const nationalContactNumber = temporaryContactNumber.slice(2)
const areaCode = nationalContactNumber.slice(0, 3)
const localNumber = nationalContactNumber.slice(3)

export const siteContact = {
  phoneDisplay: `(${areaCode}) ${localNumber.slice(0, 3)} ${localNumber.slice(3)}`,
  phoneNational: `${areaCode} ${localNumber.slice(0, 3)} ${localNumber.slice(3)}`,
  phoneHref: `tel:+${temporaryContactNumber}`,
  whatsappNumber: temporaryContactNumber,
  whatsappUrl: `https://wa.me/${temporaryContactNumber}?text=${encodeURIComponent(
    "Hola, quiero información sobre las cabañas",
  )}`,
} as const
