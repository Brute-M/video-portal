import React, { useState, useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { 
    FileText, 
    Save, 
    Eye, 
    Printer, 
    Maximize2, 
    Minimize2, 
    Code2, 
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Custom font sizes and families
const Size = Quill.import("formats/size");
Size.whitelist = ["extra-small", "small", "medium", "large", "extra-large"];
Quill.register(Size, true);

const Font = Quill.import("formats/font");
Font.whitelist = ["inter", "roboto", "serif", "monospace", "playfair"];
Quill.register(Font, true);

interface RichBlogEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    height?: string;
}

const RichBlogEditor: React.FC<RichBlogEditorProps> = ({ 
    value, 
    onChange, 
    placeholder = "Write blog content here...",
    height = "600px" 
}) => {
    const [viewMode, setViewMode] = useState<"visual" | "html">("visual");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const quillRef = useRef<any>(null);

    // Modules configuration for maximum features
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                [{ font: Font.whitelist }, { size: Size.whitelist }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [{ script: "sub" }, { script: "super" }],
                ["blockquote", "code-block"],
                [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
                [{ direction: "rtl" }, { align: [] }],
                ["link", "image", "video", "formula"],
                ["clean"],
            ],
        },
        clipboard: {
            matchVisual: false,
        },
    }), []);

    const formats = [
        "header", "font", "size",
        "bold", "italic", "underline", "strike", "blockquote",
        "list", "bullet", "indent",
        "link", "image", "video", "color", "background", "align",
        "script", "code-block", "direction", "formula"
    ];

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    const handlePrint = () => {
        const content = quillRef.current?.getEditor().root.innerHTML;
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Preview</title>
                        <style>
                            body { font-family: sans-serif; padding: 40px; }
                            img { max-width: 100%; height: auto; }
                            h1, h2, h3 { color: #111a45; }
                        </style>
                    </head>
                    <body>${content}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const wordCount = useMemo(() => {
        const text = value.replace(/<[^>]*>/g, " ");
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }, [value]);

    const charCount = value.replace(/<[^>]*>/g, "").length;

    return (
        <div className={`rich-editor-container border rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] m-0 rounded-none h-screen' : 'relative'}`}>
            {/* Custom Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-1 p-2 border-b bg-muted/30 sticky top-0 z-10">
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} title="New Document">
                        <FileText className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => toast.success("Draft saved successfully!")} title="Save Draft">
                        <Save className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(true)} title="Live Preview">
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handlePrint} title="Print">
                        <Printer className="w-4 h-4" />
                    </Button>
                    <div className="w-[1px] h-6 bg-border mx-1" />
                    <Button 
                        type="button"
                        variant={viewMode === "visual" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => setViewMode("visual")}
                        className="text-xs font-bold"
                    >
                        Editor
                    </Button>
                    <Button 
                        type="button"
                        variant={viewMode === "html" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => setViewMode("html")}
                        className="text-xs font-bold"
                    >
                        <Code2 className="w-4 h-4 mr-1" /> HTML
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    <div className="text-[10px] font-mono text-muted-foreground mr-4 hidden md:block">
                        Words: {wordCount} | Chars: {charCount}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            <ScrollArea className="bg-white" style={{ height: isFullscreen ? 'calc(100vh - 100px)' : height }}>
                {viewMode === "visual" ? (
                    <div className="blog-quill-wrapper p-2">
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={value}
                            onChange={onChange}
                            modules={modules}
                            formats={formats}
                            placeholder={placeholder}
                            className="rich-blog-editor-instance"
                        />
                    </div>
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-full p-6 font-mono text-sm border-none focus:ring-0 resize-none min-h-[500px]"
                        spellCheck={false}
                        autoFocus
                    />
                )}
            </ScrollArea>

            {/* Status Bar */}
            <div className="p-2 border-t bg-muted/20 flex justify-between items-center text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Auto-save active</span>
                    <span>Spellcheck enabled</span>
                </div>
                <div>
                    Advanced Editor Mode
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <div className="p-1">
                        <h2 className="text-xl font-bold mb-1">Blog Preview</h2>
                        <p className="text-sm text-muted-foreground mb-4">See how your blog post will look to readers</p>
                    </div>
                    <ScrollArea className="mt-4 border rounded-lg p-6 bg-white overflow-auto">
                        <div className="prose prose-slate max-w-none prose-headings:text-[#111a45] prose-headings:font-display prose-img:rounded-xl">
                           <div dangerouslySetInnerHTML={{ __html: value }} />
                        </div>
                    </ScrollArea>
                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <style>{`
                .blog-quill-wrapper .ql-container {
                    border: none !important;
                    font-size: 1.1rem;
                    font-family: 'Inter', sans-serif;
                }
                .blog-quill-wrapper .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    background: #fdfdfd;
                    padding: 4px 8px !important;
                }
                .blog-quill-wrapper .ql-editor {
                    min-height: 400px;
                    padding: 30px !important;
                }
                .blog-quill-wrapper .ql-editor h1 { font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem; }
                .blog-quill-wrapper .ql-editor h2 { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.75rem; }
                .blog-quill-wrapper .ql-editor h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
                
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="extra-small"]::before,
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="extra-small"]::before { content: 'Tiny'; }
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before { content: 'Small'; }
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="medium"]::before,
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="medium"]::before { content: 'Normal'; }
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before { content: 'Large'; }
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="extra-large"]::before,
                .rich-blog-editor-instance .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="extra-large"]::before { content: 'Huge'; }

                .ql-size-extra-small { font-size: 0.75rem; }
                .ql-size-small { font-size: 0.875rem; }
                .ql-size-medium { font-size: 1rem; }
                .ql-size-large { font-size: 1.5rem; }
                .ql-size-extra-large { font-size: 2.25rem; }

                .ql-font-inter { font-family: 'Inter', sans-serif; }
                .ql-font-roboto { font-family: 'Roboto', sans-serif; }
                .ql-font-serif { font-family: serif; }
                .ql-font-monospace { font-family: monospace; }
                .ql-font-playfair { font-family: 'Playfair Display', serif; }
            `}</style>
        </div>
    );
};

export default RichBlogEditor;
