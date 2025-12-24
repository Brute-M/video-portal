
import { Link } from "react-router-dom";
import { Phone, Mail, LogIn, Facebook, Twitter, Linkedin, Instagram, Menu } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header className="sticky top-0 z-[100] font-sans shadow-md bg-[#111a45] text-white">
            {/* Desktop Logo - Absolute Left */}
            <div className="hidden lg:flex absolute top-0 bottom-0 left-0 z-30 items-center pl-12">
                <Link to="/" className="flex items-center">
                    <img
                        src="/logo.png"
                        alt="BRPL Logo"
                        className="h-[80px] w-auto object-contain drop-shadow-lg"
                    />
                </Link>
            </div>

            {/* Top Bar - White with Slanted Left Edge */}
            <div className="w-full flex justify-end relative z-20">
                <div
                    className="bg-white text-[#111a45] h-[40px] md:h-[50px] w-full md:w-[85%] lg:w-[75%] flex items-center justify-center md:justify-end px-4 lg:px-12 gap-6"
                    style={{ clipPath: isDesktop ? "polygon(0px 0px, 100% 0px, 100% 100%, 66px 100%)" : "none" }}
                >
                    {/* Contact Info (Hide on small screens) */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            {/* <Phone className="w-4 h-4 fill-current" /> */}
                            {/* <a href="tel:+918860342926" className="text-[13px] font-bold tracking-wide hover:text-blue-600 transition-colors">+(91) 8860342926</a> */}
                        </div>
                        <div className="h-4 w-px bg-slate-300" />
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-[13px] font-bold tracking-wide">
                                info@brpl.net
                            </span>
                        </div>
                    </div>

                    {/* Login & Socials */}
                    <div className="flex items-center justify-center md:justify-end gap-4 w-full md:w-auto md:ml-auto">
                        <Link
                            to="/auth"
                            className="flex items-center gap-2 font-bold hover:text-blue-600 transition-colors group text-[13px]"
                        >
                            <LogIn className="w-4 h-4 stroke-[2.5] group-hover:stroke-blue-600" />
                            <span className="uppercase tracking-wide">LOGIN</span>
                        </Link>

                        <div className="h-4 w-px bg-slate-300" />

                        <div className="flex items-center gap-3 md:gap-4">
                            <a href="https://www.facebook.com/profile.php?id=61584782136820" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors"><Facebook className="w-3.5 h-3.5 fill-current" /></a>
                            <a href="https://x.com/BRPLOfficial" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors"><Twitter className="w-3.5 h-3.5 fill-current" /></a>
                            <a href="https://www.instagram.com/brplofficial/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors"><Instagram className="w-3.5 h-3.5 stroke-[2]" /></a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar - Logo & Navigation */}
            <div className="h-[70px] md:h-[80px] w-full flex items-center justify-between px-4 lg:pl-12 lg:pr-12 relative z-10 text-white">
                {/* Mobile Logo (Visible only on mobile/tablet) */}
                <Link to="/" className="flex items-center z-30 lg:hidden">
                    <img
                        src="/logo.png"
                        alt="BRPL Logo"
                        className="h-[60px] w-auto object-contain drop-shadow-lg"
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-8 text-[15px] font-semibold tracking-wide ml-auto">
                    {["Home", "About Us", "Teams", "Career", "Registration", "Contact Us"].map((item) => {
                        let path = "/";
                        if (item === "Home") path = "/";
                        else if (item === "Registration") path = "/auth?mode=register";
                        else path = `/${item.toLowerCase().replace(" ", "-")}`;

                        return (
                            <Link
                                key={item}
                                to={path}
                                className="hover:text-yellow-400 transition-colors relative group py-1"
                            >
                                {item}
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile Menu Button - Styled as White Card */}
                <button
                    className="lg:hidden bg-white text-[#111a45] hover:bg-gray-100 transition-colors p-2 rounded-lg border-2 border-white/20 shadow-md"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <Menu className="w-7 h-7 stroke-[2]" />
                </button>
            </div>

            {/* Mobile Menu Dropdown - Left Aligned List with Separators */}
            {isMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-[#111a45] shadow-xl border-t border-white/10 z-50 px-6 py-4">
                    <nav className="flex flex-col text-left">
                        {["Home", "About Us", "Teams", "Career", "Registration", "Contact Us"].map((item) => {
                            let path = "/";
                            if (item === "Home") path = "/";
                            else if (item === "Registration") path = "/auth?mode=register";
                            else path = `/${item.toLowerCase().replace(" ", "-")}`;

                            return (
                                <Link
                                    key={item}
                                    to={path}
                                    className="block py-4 text-white text-[16px] font-medium hover:text-yellow-400 border-b border-white/20 last:border-0"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
