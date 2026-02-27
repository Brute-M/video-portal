import { useEffect, useRef } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DATA_ATTR = "data-custom-body-script";

/**
 * Injects admin-configured scripts into document.body (just before </body>).
 * Scripts are parsed from the stored HTML string and appended so they execute.
 */
export function CustomBodyScripts() {
    const { settings } = useSiteSettings();
    const injectedRef = useRef<string>("");

    useEffect(() => {
        const raw = settings.customBodyScripts?.trim() || "";

        // Remove any previously injected scripts (same cleanup every time)
        const existing = document.body.querySelectorAll(`script[${DATA_ATTR}="true"]`);
        existing.forEach((el) => el.remove());
        injectedRef.current = "";

        if (!raw) return;

        // Avoid re-injecting the same content (e.g. after refetch)
        if (injectedRef.current === raw) return;
        injectedRef.current = raw;

        const container = document.createElement("div");
        container.innerHTML = raw;
        const scriptNodes = container.querySelectorAll("script");
        const added: HTMLScriptElement[] = [];

        scriptNodes.forEach((oldScript) => {
            const script = document.createElement("script");
            script.setAttribute(DATA_ATTR, "true");
            if (oldScript.src) {
                script.src = oldScript.src;
                if (oldScript.async) script.async = true;
                if (oldScript.defer) script.defer = true;
            } else {
                script.textContent = oldScript.textContent || "";
            }
            document.body.appendChild(script);
            added.push(script);
        });

        return () => {
            added.forEach((el) => {
                if (el.parentNode) el.parentNode.removeChild(el);
            });
            injectedRef.current = "";
        };
    }, [settings.customBodyScripts]);

    return null;
}

export default CustomBodyScripts;
