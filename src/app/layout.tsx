"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Provider } from "react-redux";
import store from "../../store";
import { ChartBarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const inter = Inter({ subsets: ["latin"] });



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Highlevel Bulk Actions</title>
      </head>
      <body className={`${inter.className} text-gray-800`}>
        <div className="flex flex-col min-h-screen max-w-[1280px] mx-auto">
          <header className="border-b border-gray-200 py-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors duration-200">
                  Highlevel Bulk Actions
                </Link>
                <nav>
                  <ul className="flex space-x-8">
                    <li>
                      <Link href="/" className="text-gray-800 hover:text-gray-600 transition-colors duration-200 font-medium flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2" />
                        Dashboard
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </header>
          <Provider store={store}>
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
          </Provider>
        </div>
      </body>
    </html>
  );
}
