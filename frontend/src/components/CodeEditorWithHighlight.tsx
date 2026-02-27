import { useRef, useEffect } from "react";

const escapeHtml = (s: string) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

/**
 * Simple syntax highlighting for HTML/JS script snippets.
 * Wraps tokens in spans with Tailwind classes for code-like colors.
 */
function highlightCode(code: string): string {
    if (!code) return "";
    let out = escapeHtml(code);
    // HTML comments
    out = out.replace(/&lt;!--[\s\S]*?--&gt;/g, (m) => `<span class="text-green-600 dark:text-green-400">${m}</span>`);
    // Tag brackets and names: <script, </script>
    out = out.replace(/(&lt;\/?)([\w-]+)/g, (_, bracket, tag) => `<span class="text-red-600 dark:text-red-400">${bracket}</span><span class="text-purple-600 dark:text-purple-400 font-semibold">${tag}</span>`);
    out = out.replace(/(&gt;)/g, '<span class="text-red-600 dark:text-red-400">$1</span>');
    // Quoted strings (double and single)
    out = out.replace(/(&quot;[^&]*&quot;)/g, '<span class="text-amber-700 dark:text-amber-400">$1</span>');
    out = out.replace(/'[^']*'/g, (m) => `<span class="text-amber-700 dark:text-amber-400">${m}</span>`);
    // JS keywords
    const keywords = ["function", "return", "var", "let", "const", "window", "document", "undefined", "true", "false", "null", "push", "arguments", "typeof", "new"];
    keywords.forEach((kw) => {
        const re = new RegExp(`\\b(${kw})\\b`, "g");
        out = out.replace(re, '<span class="text-blue-600 dark:text-blue-400 font-medium">$1</span>');
    });
    return out.replace(/\n/g, "<br/>");
}

interface CodeEditorWithHighlightProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    id?: string;
    className?: string;
}

export function CodeEditorWithHighlight({ value, onChange, placeholder, rows = 10, id, className = "" }: CodeEditorWithHighlightProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ta = textareaRef.current;
        const mirror = mirrorRef.current;
        if (!ta || !mirror) return;
        const syncScroll = () => {
            mirror.scrollTop = ta.scrollTop;
            mirror.scrollLeft = ta.scrollLeft;
        };
        ta.addEventListener("scroll", syncScroll);
        return () => ta.removeEventListener("scroll", syncScroll);
    }, []);

    const baseClass = "w-full rounded-md border border-input bg-muted/30 font-mono text-sm p-3 min-h-[200px] resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
    const lineHeight = "1.5";
    const padding = "12px";

    return (
        <div className={`relative ${className}`}>
            <div
                ref={mirrorRef}
                className="absolute inset-0 overflow-auto pointer-events-none whitespace-pre-wrap break-words border border-transparent rounded-md font-mono text-sm p-3"
                style={{ lineHeight, padding }}
                aria-hidden
            >
                <code
                    className="text-foreground"
                    dangerouslySetInnerHTML={{ __html: highlightCode(value) || (placeholder ? `<span class="text-muted-foreground">${placeholder}</span>` : "") }}
                />
            </div>
            <textarea
                ref={textareaRef}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                spellCheck={false}
                className={`${baseClass} relative bg-transparent text-transparent caret-foreground selection:bg-primary/20`}
                style={{ lineHeight, padding }}
            />
        </div>
    );
}

export default CodeEditorWithHighlight;
