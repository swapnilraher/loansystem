import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mobile = searchParams.get("mobile")
    const docType = searchParams.get("type") || "aadhaarFrontDoc"
    const rawUrl = searchParams.get("url")

    const db = getAdminDb()

    // 1. If mobile & docType provided, query Firestore partner_applications
    if (mobile) {
      const appRef = db.collection("partner_applications").doc(mobile)
      const appSnap = await appRef.get()

      if (appSnap.exists) {
        const appData = appSnap.data()
        const docObj = appData?.documents?.[docType]

        if (docObj?.base64Data) {
          const parts = docObj.base64Data.split(",")
          const mimeMatch = parts[0].match(/:(.*?);/)
          const mime = mimeMatch ? mimeMatch[1] : "application/pdf"
          const buffer = Buffer.from(parts[1], "base64")

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": mime,
              "Content-Disposition": `inline; filename="${docObj.fileName || "document.pdf"}"`,
              "Cache-Control": "public, max-age=3600",
            },
          })
        }

        if (docObj?.fileUrl && docObj.fileUrl.startsWith("http")) {
          const fetchRes = await fetch(docObj.fileUrl)
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer()
            const contentType = fetchRes.headers.get("content-type") || docObj.mimeType || "application/pdf"
            return new NextResponse(Buffer.from(arrayBuffer), {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${docObj.fileName || "document.pdf"}"`,
              },
            })
          }
        }
      }
    }

    // 2. If rawUrl provided, proxy-fetch it server-side to strip Cloudinary attachment/restriction headers
    if (rawUrl && rawUrl.startsWith("http")) {
      const fetchRes = await fetch(rawUrl)
      if (fetchRes.ok) {
        const arrayBuffer = await fetchRes.arrayBuffer()
        const contentType = fetchRes.headers.get("content-type") || "application/pdf"
        return new NextResponse(Buffer.from(arrayBuffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": "inline",
          },
        })
      }
    }

    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  } catch (err: any) {
    console.error("PDF Proxy Error:", err)
    return NextResponse.json({ error: "Failed to load document proxy" }, { status: 500 })
  }
}
