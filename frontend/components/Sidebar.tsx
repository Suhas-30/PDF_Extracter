"use client";
import { useSession, signOut, signIn } from "next-auth/react";
import Image from "next/image";

export default function Sidebar() {
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-white border-r flex flex-col justify-between min-h-screen py-6 px-4">
      <div>
        <div className="flex items-center gap-2 mb-8">
          <span className="text-blue-500 text-2xl">🧬</span>
          <span className="font-bold text-lg">nxtGen PDF Extracter</span>
        </div>
        <nav className="mb-8">
          <ul className="flex flex-col gap-2">
            <li className="font-semibold text-blue-600 bg-blue-50 rounded px-3 py-2">New Extraction</li>
            <li className="text-gray-700 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">Examples</li>
            <li className="text-gray-700 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">Settings</li>
          </ul>
        </nav>
        <div className="mb-8">
          <div className="font-semibold text-gray-500 mb-2">Resources</div>
          <ul className="flex flex-col gap-2">
            <li className="text-gray-700 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">Console</li>
            <li className="text-gray-700 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">Documentation</li>
            <li className="text-gray-700 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
              <a
                href="https://suhasportfolio-ten.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                Contact Support
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-gray-500 mb-2">Quick Links</div>
          <ul className="flex flex-col gap-2">
            <li className="text-gray-700 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">Production Access</li>
            <li className="text-gray-700 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">Pricing Info</li>
            <li className="text-gray-700 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">Book a Demo</li>
          </ul>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-8">
        {session?.user?.image ? (
          <Image src={session.user.image} alt="User" width={32} height={32} className="w-8 h-8 rounded-full" />
        ) : (
          <span className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-600">
            {session?.user?.name?.[0] || "U"}
          </span>
        )}
        <span className="text-gray-700">{session?.user?.name || "User"}</span>
        {session ? (
          <button
            onClick={() => signOut()}
            className="ml-2 px-3 py-1 bg-gray-100 rounded text-sm text-gray-600 hover:bg-gray-200"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="ml-2 px-3 py-1 bg-blue-100 rounded text-sm text-blue-600 hover:bg-blue-200"
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}