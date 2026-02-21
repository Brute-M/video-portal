import { useState, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Code, Type } from "lucide-react";

// Full toolbar: headers, formatting, lists, indent, link, blockquote, code-block, align, color, size, HTML source
const LEGAL_EDITOR_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["blockquote", "code-block"],
        ["link"],
        ["clean"],
    ],
};

const LEGAL_EDITOR_FORMATS = [
    "header", "size", "bold", "italic", "underline", "strike",
    "color", "background", "align", "list", "bullet", "indent",
    "blockquote", "code-block", "link", "script",
];

interface LegalPageEditorProps {
    title: string;
    content: string;
    onTitleChange: (value: string) => void;
    onContentChange: (value: string) => void;
    placeholder?: string;
    editorMinHeight?: string;
}

export default function LegalPageEditor({
    title,
    content,
    onTitleChange,
    onContentChange,
    placeholder = "Page title",
    editorMinHeight = "400px",
}: LegalPageEditorProps) {
    const [activeTab, setActiveTab] = useState<"visual" | "html">("visual");
    const [htmlSource, setHtmlSource] = useState(content);

    const modules = useMemo(() => LEGAL_EDITOR_MODULES, []);
    const formats = useMemo(() => LEGAL_EDITOR_FORMATS, []);

    const handleTabChange = (value: string) => {
        if (value === "html") {
            setHtmlSource(content);
        } else {
            onContentChange(htmlSource);
        }
        setActiveTab(value as "visual" | "html");
    };

    const displayHtml = activeTab === "html" ? htmlSource : content;

    const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setHtmlSource(e.target.value);
        onContentChange(e.target.value);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Page Title</Label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
            <div className="space-y-2">
                <Label>Content</Label>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full max-w-[280px] grid-cols-2">
                        <TabsTrigger value="visual" className="flex items-center gap-2">
                            <Type className="w-4 h-4" /> Visual
                        </TabsTrigger>
                        <TabsTrigger value="html" className="flex items-center gap-2">
                            <Code className="w-4 h-4" /> HTML
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="visual" className="mt-2">
                        <div className="legal-editor-wrapper rounded-md border bg-background">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={onContentChange}
                                modules={modules}
                                formats={formats}
                                placeholder="Write your content here. Use the toolbar for headings, links, lists, and more."
                                className="legal-quill-editor"
                                style={{ minHeight: editorMinHeight }}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="html" className="mt-2">
                        <textarea
                            value={displayHtml}
                            onChange={handleHtmlChange}
                            className="w-full rounded-md border border-input bg-muted/30 p-4 font-mono text-sm min-h-[400px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder={'Paste or edit HTML here. Links: use <a href="/path">text</a> for internal pages.'}
                            spellCheck={false}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Use {"<a href=\"/path\">text</a>"} for links. Internal: /privacy-policy, /terms-and-conditions, /
                        </p>
                    </TabsContent>
                </Tabs>
            </div>
            {/* Match public page font and link styling inside editor */}
            <style>{`
                .legal-quill-editor .ql-editor {
                    font-family: inherit;
                    font-size: 1.05rem;
                    line-height: 1.75;
                    color: #475569;
                }
                .legal-quill-editor .ql-editor a {
                    color: #2563eb !important;
                    text-decoration: underline;
                    font-weight: 600;
                }
                .legal-quill-editor .ql-editor a:hover {
                    color: #1d4ed8 !important;
                }
                .legal-quill-editor .ql-editor h1,
                .legal-quill-editor .ql-editor h2,
                .legal-quill-editor .ql-editor h3,
                .legal-quill-editor .ql-editor h4,
                .legal-quill-editor .ql-editor h5,
                .legal-quill-editor .ql-editor h6 {
                    color: #111a45;
                    font-weight: 700;
                }
                .legal-quill-editor .ql-container {
                    font-size: 1rem;
                }
            `}</style>
        </div>
    );
}
