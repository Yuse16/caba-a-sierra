const contactNumber = "528442779477"

const nationalContactNumber = contactNumber.slice(2)
const areaCode = nationalContactNumber.slice(0, 3)
const localNumber = nationalContactNumber.slice(3)

export const siteContact = {
  email: "cabanasdupez@gmail.com",
  phoneDisplay: `(${areaCode}) ${localNumber.slice(0, 3)} ${localNumber.slice(3)}`,
  phoneNational: `${areaCode} ${localNumber.slice(0, 3)} ${localNumber.slice(3)}`,
  phoneHref: `tel:+${contactNumber}`,
  whatsappNumber: contactNumber,
  whatsappUrl: `https://wa.me/${contactNumber}?text=${encodeURIComponent(
    "Hola, quiero información sobre las cabañas",
  )}`,
} as const
