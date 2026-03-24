import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportContactLeadsExcel, getContactLeads, type ContactLead } from "@/apihelper/contactAdmin";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Eye, FileSpreadsheet, Loader2, Mail } from "lucide-react";

const truncateText = (text: string, maxLen: number) => {
    if (!text) return "";
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}...`;
};

const AdminContactUsLeads = () => {
    const { toast } = useToast();

    const limit = 10;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [leads, setLeads] = useState<ContactLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null);

    useEffect(() => {
        fetchLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, searchQuery]);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const response = await getContactLeads(page, limit, searchQuery);
            setLeads(response.data.items || []);
            setTotalPages(response.data.pagination?.pages || 1);
            setTotalRecords(response.data.pagination?.total || 0);
        } catch (error) {
            console.error("Failed to fetch contact leads:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch contact leads.",
            });
            setLeads([]);
            setTotalPages(1);
            setTotalRecords(0);
        } finally {
            setIsLoading(false);
        }
    };

    const leadName = useMemo(() => {
        if (!selectedLead) return "";
        return `${selectedLead.firstName || ""} ${selectedLead.lastName || ""}`.trim() || "N/A";
    }, [selectedLead]);

    const handleViewLead = (lead: ContactLead) => {
        setSelectedLead(lead);
        setIsViewOpen(true);
    };

    const applySearch = () => {
        setPage(1);
        setSearchQuery(searchInput.trim());
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                        <Mail className="w-6 h-6" />
                        Contact Us Leads
                    </h1>
                    <div className="text-sm text-muted-foreground">
                        {totalRecords} lead{totalRecords === 1 ? "" : "s"} found
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") applySearch();
                        }}
                        placeholder="Search by name, email, mobile..."
                        className="w-full sm:w-[320px]"
                    />
                    <Button variant="outline" onClick={applySearch}>
                        Search
                    </Button>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            try {
                                toast({ description: "Generating export..." });
                                const blob = await exportContactLeadsExcel(searchQuery);
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute(
                                    "download",
                                    `Contact_Us_Leads_Export_${new Date().toISOString().split("T")[0]}.xlsx`
                                );
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                                toast({ title: "Success", description: "Export downloaded successfully." });
                            } catch (error) {
                                console.error("Export failed", error);
                                toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to export contact leads.",
                                });
                            }
                        }}
                        className="gap-2"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                    </Button>
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-lg">Leads List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                            <div className="mt-2 text-muted-foreground">Loading contact leads...</div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No.</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Submitted At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                                            No contact leads found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leads.map((lead, index) => (
                                        <TableRow key={lead._id}>
                                            <TableCell className="font-medium">
                                                {(page - 1) * limit + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {lead.firstName || lead.lastName
                                                    ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell>{lead.email || "N/A"}</TableCell>
                                            <TableCell>{lead.mobileNumber || "N/A"}</TableCell>
                                            <TableCell className="max-w-[320px]">
                                                <span className="block truncate" title={lead.message}>
                                                    {truncateText(lead.message, 70) || "N/A"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "N/A"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => handleViewLead(lead)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {!isLoading && leads.length > 0 && (
                        <div className="flex items-center justify-between mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Prev
                            </Button>

                            <div className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            {leadName}
                        </DialogTitle>
                        <DialogDescription>
                            Full contact submission details.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLead ? (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Email</div>
                                    <div className="break-words font-medium">{selectedLead.email || "N/A"}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Mobile</div>
                                    <div className="break-words font-medium">{selectedLead.mobileNumber || "N/A"}</div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Message</div>
                                <div className="rounded-lg border p-4 bg-muted/30 whitespace-pre-wrap">
                                    {selectedLead.message || "N/A"}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Submitted At</div>
                                <div className="font-medium">
                                    {selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString() : "N/A"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground py-4">No lead selected.</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminContactUsLeads;

