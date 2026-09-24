"use server"

import { createSupabaseServiceClient } from "@/lib/supabase/service.server"

export type BookingInquiryInput = {
  cabinId: string
  customerName: string
  phone: string
  checkIn: string
  checkOut: string
  guests: number
  message: string
  idempotencyKey: string
}

export type BookingInquiryResult =
  | { ok: true; inquiryId: string }
  | { ok: false; message: string }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function todayInMonterrey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function normalizeMexicanPhone(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 10) return `+52${digits}`
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`
  return null
}

function validateInput(input: BookingInquiryInput) {
  const customerName = input.customerName.trim()
  const phoneE164 = normalizeMexicanPhone(input.phone)
  const message = input.message.trim()
  if (!uuidPattern.test(input.cabinId) || !uuidPattern.test(input.idempotencyKey)) return null
  if (customerName.length < 2 || customerName.length > 120 || !phoneE164) return null
  if (!datePattern.test(input.checkIn) || !datePattern.test(input.checkOut)) return null
  if (input.checkIn < todayInMonterrey() || input.checkOut <= input.checkIn) return null
  if (!Number.isSafeInteger(input.guests) || input.guests < 1) return null
  if (message.length > 2000) return null
  return { customerName, phoneE164, message }
}

export async function createBookingInquiryAction(input: BookingInquiryInput): Promise<BookingInquiryResult> {
  const valid = validateInput(input)
  if (!valid) return { ok: false, message: "Revisa tu nombre, teléfono, fechas y número de huéspedes." }

  try {
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase.rpc("create_website_booking_inquiry", {
      p_cabin_id: input.cabinId,
      p_customer_name: valid.customerName,
      p_phone_display: input.phone.trim(),
      p_phone_e164: valid.phoneE164,
      p_check_in: input.checkIn,
      p_check_out: input.checkOut,
      p_guests: input.guests,
      p_message: valid.message,
      p_idempotency_key: input.idempotencyKey,
    })
    if (error || typeof data !== "string") throw error ?? new Error("La solicitud no devolvió un identificador.")
    return { ok: true, inquiryId: data }
  } catch (error) {
    console.error("createBookingInquiryAction", error instanceof Error ? error.message : "UNKNOWN_ERROR")
    return { ok: false, message: "No pudimos registrar tu solicitud. Intenta nuevamente." }
  }
}
