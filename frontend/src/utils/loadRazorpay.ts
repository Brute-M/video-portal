const RAZORPAY_URL = "https://checkout.razorpay.com/v1/checkout.js";
let loadPromise: Promise<typeof window.Razorpay> | null = null;

/**
 * Load Razorpay script on demand (used on payment pages only).
 * Resolves with the Razorpay constructor when the script is ready.
 */
export function loadRazorpay(): Promise<typeof window.Razorpay> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay is only available in the browser"));
  }
  if ((window as any).Razorpay) {
    return Promise.resolve((window as any).Razorpay);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_URL}"]`);
    if (existing) {
      const check = () => (window as any).Razorpay ? resolve((window as any).Razorpay) : setTimeout(check, 50);
      check();
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_URL;
    script.async = true;
    script.onload = () => resolve((window as any).Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
