import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[16rem] grid-cols-1 md:grid-cols-3 gap-5 max-w-9xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoCard = ({
    className,
    title,
    description,
    header,
    icon,
    children,
    spotlight = true,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    spotlight?: boolean;
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current || !spotlight) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "relative row-span-1 rounded-2xl group/bento transition duration-200 overflow-hidden",
                "bg-slate-950 border border-white/5",
                "shadow-2xl shadow-black/50",
                className
            )}
        >
            {/* Spotlight Effect */}
            {spotlight && (
                <div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                    style={{
                        opacity,
                        background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
                    }}
                />
            )}

            {/* Content Container */}
            <div className="relative h-full flex flex-col justify-between p-5 space-y-4 z-10">
                {/* Header Slot (Optional) - usually for big visuals like gradients or images */}
                {header && <div className="rounded-xl overflow-hidden">{header}</div>}

                {/* Main Content */}
                <div className="group-hover/bento:translate-x-1 transition duration-200">
                    {/* Icon & Title Group */}
                    <div className="flex items-center gap-3 mb-2">
                        {icon && (
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-caneris-cyan">
                                {icon}
                            </div>
                        )}
                        <div className="font-sans font-bold text-slate-100 selection:bg-caneris-cyan/20">
                            {title}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="font-sans font-medium text-slate-400 text-xs leading-relaxed max-w-[90%]">
                        {description}
                    </div>

                    {/* Children (Inputs, etc) */}
                    {children && <div className="mt-4">{children}</div>}
                </div>
            </div>

            {/* Subtle Gradient Overlay for Depth */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/bento:opacity-100 transition duration-500" />
        </div>
    );
};
