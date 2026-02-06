import { useEffect, useState } from "react";
import api from "@/apihelper/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Partner {
    _id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email: string;
    contactNumber: string;
    partnershipType: string;
    message: string;
    createdAt: string;
}

const AdminPartners = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const response = await api.get("/api/partners");
                setPartners(response.data);
            } catch (error) {
                console.error("Error fetching partners:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPartners();
    }, []);

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-6">Partner Requests</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Multi Info</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {partners.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    No partner requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            partners.map((partner) => (
                                <TableRow key={partner._id}>
                                    <TableCell>
                                        {format(new Date(partner.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{partner.firstName} {partner.lastName}</div>
                                        {partner.companyName && <div className="text-sm text-gray-500">{partner.companyName}</div>}
                                    </TableCell>
                                    <TableCell>{partner.email}</TableCell>
                                    <TableCell>{partner.contactNumber}</TableCell>
                                    <TableCell>{partner.partnershipType}</TableCell>
                                    <TableCell className="max-w-md truncate" title={partner.message}>
                                        {partner.message}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedPartner(partner)}
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle>Partner Request Details</DialogTitle>
                        <DialogDescription>
                            Submitted on {selectedPartner && format(new Date(selectedPartner.createdAt), "PPP p")}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPartner && (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                                    <p className="font-medium">{selectedPartner.firstName} {selectedPartner.lastName}</p>
                                    {selectedPartner.companyName && <p className="text-sm text-gray-500 mt-1">{selectedPartner.companyName}</p>}
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                                    <p className="font-medium">{selectedPartner.contactNumber}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Email Address</h4>
                                <p className="font-medium">{selectedPartner.email}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Partnership Type</h4>
                                <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mt-1">
                                    {selectedPartner.partnershipType}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Message</h4>
                                <div className="bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                                    {selectedPartner.message}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPartners;
