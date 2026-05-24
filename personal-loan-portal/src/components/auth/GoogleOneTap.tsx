"use client"
import React, { useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"

export function GoogleOneTap() {
  const { loginWithGoogle } = useAuth();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    const initializeGoogleOneTap = () => {
      if (typeof window !== "undefined" && (window as any).google && !isInitialized.current) {
        try {
          isInitialized.current = true;
          (window as any).google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "111067608681412122498.apps.googleusercontent.com",
            callback: async (response: any) => {
              console.log("One Tap Credential Received");
              if (response.credential) {
                try {
                  await loginWithGoogle(response.credential);
                  console.log("One Tap Login Successful");
                } catch (error) {
                  console.error("One Tap Login Failed:", error);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            itp_support: true,
            use_fedcm_for_prompt: false, // Disabled due to React StrictMode triggering NotAllowedError
          });

          (window as any).google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              console.warn("One Tap not displayed:", notification.getNotDisplayedReason());
            } else if (notification.isSkippedMoment()) {
              console.warn("One Tap skipped:", notification.getSkippedReason());
            } else if (notification.isDismissedMoment()) {
              console.warn("One Tap dismissed:", notification.getDismissedReason());
            }
          });
        } catch (error) {
          console.error("Google One Tap Error:", error);
          isInitialized.current = false;
        }
      }
    };

    // Load Google Script if not already loaded
    if (!document.getElementById("google-client-script")) {
      const script = document.createElement("script");
      script.id = "google-client-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleOneTap;
      document.head.appendChild(script);
    } else {
      initializeGoogleOneTap();
    }

    return () => {
      // Intentionally leaving this empty to prevent FedCM AbortError.
      // Since Google One Tap is globally attached to the window and we use
      // a ref to prevent double-initialization, we don't need to cancel it
      // on React unmounts.
    };
  }, [loginWithGoogle]);

  return null;
}
