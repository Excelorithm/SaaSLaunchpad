'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Settings, Shield, Activity, Menu, FileText, FolderTree, Tags, Image, MessageSquare, PenTool } from 'lucide-react';
import { useEffect } from 'react';
import { requestPermission } from '@/lib/notifications/push/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  useEffect( () => {
    requestPermission()
  }, []);
  
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: Users, label: 'Team' },
    { href: '/dashboard/general', icon: Settings, label: 'General' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' },
  ];

  const blogNavItems = [
    { href: '/dashboard/blog/posts', icon: FileText, label: 'Posts' },
    { href: '/dashboard/blog/categories', icon: FolderTree, label: 'Categories' },
    { href: '/dashboard/blog/tags', icon: Tags, label: 'Tags' },
    { href: '/dashboard/blog/media', icon: Image, label: 'Media' },
    { href: '/dashboard/blog/comments', icon: MessageSquare, label: 'Comments' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Settings</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            <div className="mb-4">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</p>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                    className={`shadow-none my-1 w-full justify-start ${
                      isActive(item.href) ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            <div className="border-t pt-4">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <PenTool className="h-3 w-3" />
                Blog
              </p>
              {blogNavItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                    className={`shadow-none my-1 w-full justify-start ${
                      isActive(item.href) ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
