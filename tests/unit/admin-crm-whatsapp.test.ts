import { describe, expect, it } from "vitest"
import { customerWhatsAppUrl, whatsappMessage } from "@/lib/admin-crm/whatsapp"
import type { CrmInquiry } from "@/lib/admin-crm/types"

const inquiry: CrmInquiry = { id:"i",cabinId:"c1",cabinName:"Bosque Real",customerId:"u",customerName:"Ana López",phoneDisplay:"844 123 4567",phoneE164:"+528441234567",checkIn:"2030-12-24",checkOut:"2030-12-27",guests:75,message:"",status:"new",version:1,createdAt:"2030-01-01T00:00:00Z",updatedAt:"2030-01-01T00:00:00Z",lastContactAt:null,events:[],notes:[] }
describe("plantillas CRM de WhatsApp",()=>{
  it("usa el teléfono E.164 del cliente y conserva fechas/huéspedes",()=>{const message=whatsappMessage("received",inquiry);const url=new URL(customerWhatsAppUrl(inquiry.phoneE164,message));expect(url.hostname).toBe("wa.me");expect(url.pathname).toBe("/528441234567");expect(url.searchParams.get("text")).toContain("75 personas");expect(url.searchParams.get("text")).toContain("24 de diciembre de 2030")})
  it("ofrece sólo la cabaña alternativa y su URL pública",()=>{const message=whatsappMessage("alternative",inquiry,{id:"c2",name:"Niebla",slug:"niebla"},"https://dupez.mx");expect(message).toContain("Niebla");expect(message).toContain("https://dupez.mx/?cabana=niebla");expect(message).not.toContain("propietario")})
})
