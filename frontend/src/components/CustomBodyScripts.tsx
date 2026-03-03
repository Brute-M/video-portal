import { useEffect, useRef } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const DATA_ATTR = "data-custom-body-script";

/**
 * Injects admin-configured scripts and markup (e.g. GTM noscript) into document.body.
 * Parses the stored HTML string: scripts are re-created so they execute; other elements (noscript, etc.) are appended as-is.
 */
export function CustomBodyScripts() {
    const { settings } = useSiteSettings();
    const injectedRef = useRef<string>("");

    useEffect(() => {
        const raw = settings.customBodyScripts?.trim() || "";

        const existing = document.body.querySelectorAll(`[${DATA_ATTR}="true"]`);
        existing.forEach((el) => el.remove());
        injectedRef.current = "";

        if (!raw) return;

        if (injectedRef.current === raw) return;
        injectedRef.current = raw;

        const container = document.createElement("div");
        container.innerHTML = raw;
        const added: HTMLElement[] = [];

        Array.from(container.childNodes).forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const oldEl = node as HTMLElement;
            const tag = oldEl.tagName.toLowerCase();
            const newEl = document.createElement(oldEl.tagName);
            newEl.setAttribute(DATA_ATTR, "true");

            if (tag === "script") {
                const script = newEl as HTMLScriptElement;
                const oldScript = oldEl as HTMLScriptElement;
                if (oldScript.src) {
                    script.src = oldScript.src;
                    if (oldScript.async) script.async = true;
                    if (oldScript.defer) script.defer = true;
                } else {
                    script.textContent = oldScript.textContent || "";
                }
            } else {
                Array.from(oldEl.attributes).forEach((attr) => {
                    newEl.setAttribute(attr.name, attr.value);
                });
                newEl.innerHTML = oldEl.innerHTML;
            }
            document.body.appendChild(newEl);
            added.push(newEl);
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
