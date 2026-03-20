'use client';

import React from 'react';
import '../styles/admin.css';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="admin-content" style={{ padding: 0 }}>
            {children}
        </div>
    );
}
