
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createUser } from "@/apihelper/admin";
import { Loader2, UserPlus } from "lucide-react";

interface CreateUserModalProps {
    onUserCreated?: () => void;
}

export function CreateUserModal({ onUserCreated }: CreateUserModalProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fname: "",
        lname: "",
        email: "",
        mobile: "",
        city: "",
        state: "",
        country: "India",
        playerRole: "",
        password: "",
        isPaid: false,
        paymentAmount: 1499,
        paymentId: "",
        isFromLandingPage: true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createUser(formData);
            toast({
                title: "Success",
                description: "User created successfully.",
            });
            setOpen(false);
            // Reset form
            setFormData({
                fname: "",
                lname: "",
                email: "",
                mobile: "",
                city: "",
                state: "",
                country: "India",
                playerRole: "",
                password: "",
                isPaid: false,
                paymentAmount: 1499,
                paymentId: "",
                isFromLandingPage: true,
            });
            if (onUserCreated) onUserCreated();
        } catch (error: any) {
            console.error("Failed to create user", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to create user.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Manually create a new user record. Fill in all required fields.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fname">First Name *</Label>
                            <Input
                                id="fname"
                                name="fname"
                                value={formData.fname}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lname">Last Name</Label>
                            <Input
                                id="lname"
                                name="lname"
                                value={formData.lname}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile Number *</Label>
                            <Input
                                id="mobile"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Input
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State *</Label>
                            <Input
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="playerRole">Select Your Role</Label>
                        <Select
                            onValueChange={(val) => handleSelectChange("playerRole", val)}
                            value={formData.playerRole}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose your playing role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Batsman">Batsman</SelectItem>
                                <SelectItem value="Bowler">Bowler</SelectItem>
                                <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                                <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password (Optional)</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Leave blank for default (Brpl@123)"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                        <Checkbox
                            id="isFromLandingPage"
                            checked={formData.isFromLandingPage}
                            onCheckedChange={(checked) =>
                                handleCheckboxChange("isFromLandingPage", checked as boolean)
                            }
                        />
                        <Label htmlFor="isFromLandingPage">Is From Landing Page?</Label>
                    </div>

                    <div className="border p-4 rounded-md space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isPaid"
                                checked={formData.isPaid}
                                onCheckedChange={(checked) =>
                                    handleCheckboxChange("isPaid", checked as boolean)
                                }
                            />
                            <Label htmlFor="isPaid" className="font-bold">
                                Mark as Paid User?
                            </Label>
                        </div>

                        {formData.isPaid && (
                            <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
                                <div className="space-y-2">
                                    <Label htmlFor="paymentAmount">Amount (INR) *</Label>
                                    <Input
                                        id="paymentAmount"
                                        name="paymentAmount"
                                        type="number"
                                        value={formData.paymentAmount}
                                        onChange={handleChange}
                                        required={formData.isPaid}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentId">Transaction ID *</Label>
                                    <Input
                                        id="paymentId"
                                        name="paymentId"
                                        value={formData.paymentId}
                                        onChange={handleChange}
                                        required={formData.isPaid}
                                        placeholder="e.g. T1234567890"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
