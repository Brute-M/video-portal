import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FilterBarProps {
    onFilterChange: (filters: { search: string; startDate?: Date; endDate?: Date }) => void;
}

export const FilterBar = ({ onFilterChange }: FilterBarProps) => {
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    const handleApply = () => {
        onFilterChange({ search, startDate, endDate });
    };

    const handleClear = () => {
        setSearch("");
        setStartDate(undefined);
        setEndDate(undefined);
        onFilterChange({ search: "" });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                />
            </div>

            <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? (
                                endDate ? (
                                    <>
                                        {format(startDate, "LLL dd, y")} -{" "}
                                        {format(endDate, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(startDate, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={startDate}
                            selected={{ from: startDate, to: endDate }}
                            onSelect={(range) => {
                                setStartDate(range?.from);
                                setEndDate(range?.to);
                            }}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>

                <Button onClick={handleApply}>Apply</Button>
                <Button variant="ghost" onClick={handleClear} size="icon" title="Reset Filters">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
