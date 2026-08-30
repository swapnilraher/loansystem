import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"

export const runtime = "nodejs"

function getCleanMobile(val: string | null): string {
  if (!val) return ""
  const digits = val.replace(/[^0-9]/g, "")
  return digits.length >= 10 ? digits.slice(-10) : digits
}

function resolveMimeFromBase64(base64Str: string): string {
  if (base64Str.startsWith("data:")) {
    const match = base64Str.match(/data:([^;]+);base64,/)
    if (match) return match[1]
  }
  if (base64Str.startsWith("JVBERi")) return "application/pdf"
  if (base64Str.startsWith("/9j/")) return "image/jpeg"
  if (base64Str.startsWith("iVBORw0KGgo")) return "image/png"
  return "application/pdf"
}

function convertBufferIfBase64Text(arrayBuffer: ArrayBuffer, defaultMime?: string): { buffer: Buffer; mime: string } {
  const rawBuffer = Buffer.from(arrayBuffer)
  const fullText = rawBuffer.toString("utf-8").trim()

  // 1. Look for XML <Photo> tag in DigiLocker XML
  const photoMatch = fullText.match(/<photo[^>]*>([\s\S]*?)<\/photo>/i)
  if (photoMatch) {
    const cleanB64 = photoMatch[1].replace(/[^A-Za-z0-9+/=]/g, "")
    if (cleanB64.length > 50) {
      return {
        buffer: Buffer.from(cleanB64, "base64"),
        mime: "image/jpeg",
      }
    }
  }

  // 2. Look for /9j/ JPEG Base64 (ignoring trailing DigiLocker certificate strings like CN=DS...)
  const jpegMatch = fullText.match(/\/9j\/[A-Za-z0-9+/=]+/)
  if (jpegMatch && jpegMatch[0].length > 50) {
    const cleanB64 = jpegMatch[0].replace(/[^A-Za-z0-9+/=]/g, "")
    return {
      buffer: Buffer.from(cleanB64, "base64"),
      mime: "image/jpeg",
    }
  }

  // 3. Look for iVBORw0KGgo PNG Base64
  const pngMatch = fullText.match(/iVBORw0KGgo[A-Za-z0-9+/=]+/)
  if (pngMatch && pngMatch[0].length > 50) {
    const cleanB64 = pngMatch[0].replace(/[^A-Za-z0-9+/=]/g, "")
    return {
      buffer: Buffer.from(cleanB64, "base64"),
      mime: "image/png",
    }
  }

  // 4. Look for JVBERi PDF Base64
  const pdfMatch = fullText.match(/JVBERi[A-Za-z0-9+/=]+/)
  if (pdfMatch && pdfMatch[0].length > 50) {
    const cleanB64 = pdfMatch[0].replace(/[^A-Za-z0-9+/=]/g, "")
    return {
      buffer: Buffer.from(cleanB64, "base64"),
      mime: "application/pdf",
    }
  }

  const textPreview = fullText.slice(0, 50)
  return {
    buffer: rawBuffer,
    mime: defaultMime || (textPreview.startsWith("%PDF") ? "application/pdf" : "image/jpeg"),
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mobileParam = searchParams.get("mobile") || searchParams.get("id")
    const docType = (searchParams.get("type") || "aadhaarFrontDoc").trim()
    const rawUrl = searchParams.get("url")

    // 1. If rawUrl provided, proxy-fetch it server-side to bypass CORS / attachment disposition
    if (rawUrl && rawUrl.startsWith("http")) {
      try {
        const fetchRes = await fetch(rawUrl, { cache: "no-store" })
        if (fetchRes.ok) {
          const arrayBuffer = await fetchRes.arrayBuffer()
          const contentType = fetchRes.headers.get("content-type") || ""
          const { buffer, mime } = convertBufferIfBase64Text(arrayBuffer, contentType)

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": mime,
              "Content-Disposition": "inline",
              "Cache-Control": "public, max-age=3600",
            },
          })
        }
      } catch (e) {
        console.warn("Proxy rawUrl fetch warning:", e)
      }
    }

    const cleanMobile = getCleanMobile(mobileParam)
    if (!cleanMobile && !mobileParam) {
      return NextResponse.json({ error: "Mobile number or ID is required" }, { status: 400 })
    }

    const db = getAdminDb()

    // 2. Look up document in partner_applications and users collections
    const possibleDocIds = [cleanMobile, mobileParam, `TSM-P-${cleanMobile}`, `partner_${cleanMobile}`].filter(Boolean) as string[]
    
    let targetDocObj: any = null
    let appData: any = null

    for (const docId of possibleDocIds) {
      const appSnap = await db.collection("partner_applications").doc(docId).get()
      if (appSnap.exists) {
        appData = appSnap.data()
        break
      }
    }

    if (!appData) {
      for (const docId of possibleDocIds) {
        const userSnap = await db.collection("users").doc(docId).get()
        if (userSnap.exists) {
          appData = userSnap.data()
          break
        }
      }
    }

    if (appData) {
      const docs = appData.documents || {}

      // Possible key aliases
      const candidateKeys = [
        docType,
        docType.toLowerCase(),
        docType === "aadhaarFrontDoc" ? "aadhaarDoc" : null,
        docType === "aadhaarDoc" ? "aadhaarFrontDoc" : null,
        docType === "panDoc" ? "panCardDoc" : null,
        docType === "panCardDoc" ? "panDoc" : null,
      ].filter(Boolean) as string[]

      for (const key of candidateKeys) {
        if (docs[key]) {
          targetDocObj = docs[key]
          break
        }
      }

      // Check kycData photo fallback for Aadhaar / PAN
      if (!targetDocObj && (docType.includes("aadhaar") || docType.includes("kyc"))) {
        if (appData.kycData?.photoBase64) {
          targetDocObj = {
            base64Data: appData.kycData.photoBase64,
            mimeType: "image/jpeg",
            fileName: "Aadhaar_KYC_Photo.jpg",
          }
        }
      }
    }

    if (!targetDocObj) {
      return NextResponse.json({ error: "Document not found for this partner" }, { status: 404 })
    }

    // 3. If base64Data is present
    const base64Str = targetDocObj.base64Data || (typeof targetDocObj === "string" && targetDocObj.startsWith("data:") ? targetDocObj : null)
    if (base64Str) {
      const mime = resolveMimeFromBase64(base64Str)
      const rawBase64 = base64Str.includes(",") ? base64Str.split(",")[1] : base64Str
      const buffer = Buffer.from(rawBase64, "base64")

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `inline; filename="${targetDocObj.fileName || "document"}"`,
          "Cache-Control": "public, max-age=3600",
        },
      })
    }

    // 4. If fileUrl is a remote URL
    const fileUrl = targetDocObj.fileUrl || targetDocObj.url
    if (fileUrl && typeof fileUrl === "string" && fileUrl.startsWith("http")) {
      const fetchRes = await fetch(fileUrl, { cache: "no-store" })
      if (fetchRes.ok) {
        const arrayBuffer = await fetchRes.arrayBuffer()
        const contentType = fetchRes.headers.get("content-type") || targetDocObj.mimeType || ""
        const { buffer, mime } = convertBufferIfBase64Text(arrayBuffer, contentType)

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Content-Disposition": `inline; filename="${targetDocObj.fileName || "document"}"`,
            "Cache-Control": "public, max-age=3600",
          },
        })
      }
    }

    // 5. If fileUrl is base64 string
    if (fileUrl && typeof fileUrl === "string" && (fileUrl.startsWith("data:") || fileUrl.length > 200)) {
      const mime = resolveMimeFromBase64(fileUrl)
      const rawBase64 = fileUrl.includes(",") ? fileUrl.split(",")[1] : fileUrl
      const buffer = Buffer.from(rawBase64, "base64")

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `inline; filename="${targetDocObj.fileName || "document"}"`,
          "Cache-Control": "public, max-age=3600",
        },
      })
    }

    return NextResponse.json({ error: "Invalid document format" }, { status: 404 })
  } catch (err: any) {
    console.error("PDF Proxy Error:", err)
    return NextResponse.json({ error: "Failed to load document proxy" }, { status: 500 })
  }
}
