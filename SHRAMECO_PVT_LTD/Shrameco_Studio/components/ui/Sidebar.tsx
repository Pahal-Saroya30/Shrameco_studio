'use client';

import React, { createContext, useContext, useState, useEffect, forwardRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarContextType {
	state: 'expanded' | 'collapsed';
	open: boolean;
	setOpen: (open: boolean) => void;
	toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error('useSidebar must be used within a SidebarProvider');
	}
	return context;
}

interface SidebarProviderProps {
	children: React.ReactNode;
	defaultOpen?: boolean;
}

export function SidebarProvider({ children, defaultOpen = false }: SidebarProviderProps) {
	const [open, setOpen] = useState(defaultOpen);

	const toggleSidebar = () => setOpen((prev) => !prev);
	const state = open ? 'expanded' : 'collapsed';

	return (
		<SidebarContext.Provider value={{ state, open, setOpen, toggleSidebar }}>
			{children}
		</SidebarContext.Provider>
	);
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export function Sidebar({ children, className = '', ...props }: SidebarProps) {
	const { state } = useSidebar();
	const isCollapsed = state === 'collapsed';

	return (
		<aside
			className={`h-screen bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex sticky top-0 left-0 relative z-40 transition-all duration-300 ${
				isCollapsed ? 'w-[64px]' : 'w-[260px]'
			} ${className}`}
			{...props}
		>
			{children}
		</aside>
	);
}

export function SidebarHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
	const { state } = useSidebar();
	const isCollapsed = state === 'collapsed';

	return (
		<div
			className={`py-6 flex items-center bg-white ${
				isCollapsed ? 'justify-center border-b border-slate-50' : 'px-6 justify-between'
			} ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

export function SidebarContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
	const { state } = useSidebar();
	const isCollapsed = state === 'collapsed';
	return (
		<div className={`flex-1 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto'} select-none ${className}`} {...props}>
			{children}
		</div>
	);
}

export function SidebarFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`bg-white ${className}`} {...props}>
			{children}
		</div>
	);
}

export function SidebarGroup({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`space-y-2 ${className}`} {...props}>
			{children}
		</div>
	);
}

export function SidebarGroupLabel({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`px-5 text-[11px] font-medium text-slate-400 uppercase tracking-wider ${className}`} {...props}>
			{children}
		</div>
	);
}

export function SidebarGroupContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`${className}`} {...props}>
			{children}
		</div>
	);
}

export function SidebarMenu({ children, className = '', ...props }: React.HTMLAttributes<HTMLUListElement>) {
	const { state } = useSidebar();
	const isCollapsed = state === 'collapsed';

	return (
		<ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'} ${className}`} {...props}>
			{children}
		</ul>
	);
}

export function SidebarMenuItem({ children, className = '', ...props }: React.HTMLAttributes<HTMLLIElement>) {
	return (
		<li className={`${className}`} {...props}>
			{children}
		</li>
	);
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	isActive?: boolean;
}

export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
	({ asChild, isActive, children, className = '', ...props }, ref) => {
		const { state } = useSidebar();
		const isCollapsed = state === 'collapsed';

		const buttonClasses = `flex items-center rounded-lg text-sm font-medium transition-colors w-full ${
			isActive
				? 'bg-violet-50 text-violet-700 font-bold'
				: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
		} ${isCollapsed ? 'justify-center p-2 w-10 h-10 mx-auto' : 'space-x-3 px-3 py-2'} ${className}`;

		if (asChild && React.isValidElement(children)) {
			const childProps = children.props as any;
			return React.cloneElement(children, {
				className: `${childProps.className || ''} ${buttonClasses}`,
				...props,
			} as any);
		}

		return (
			<button ref={ref} className={buttonClasses} {...props}>
				{children}
			</button>
		);
	}
);

SidebarMenuButton.displayName = 'SidebarMenuButton';

export function SidebarTrigger({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { state, toggleSidebar } = useSidebar();
	const isCollapsed = state === 'collapsed';

	return (
		<button
			onClick={toggleSidebar}
			className={`absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-all z-50 hover:scale-105 active:scale-95 duration-200 ${className}`}
			title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			{...props}
		>
			{isCollapsed ? (
				<ChevronRight className="w-3.5 h-3.5 text-slate-500" />
			) : (
				<ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
			)}
		</button>
	);
}
