import {useSession, signOut} from "next-auth/react";
import React, {FC, ReactNode} from "react";
import Auth from "@trending/components/auth";
import { Menu } from '@headlessui/react';
import {NotificationBell, NovuProvider, PopoverNotificationCenter} from "@novu/notification-center";

export const Layout: FC<{children: ReactNode}> = (props) => {
    const {children} = props;
    const {status, data} = useSession();
    if (status === 'loading') {
        return <></>
    }

    if (status === 'unauthenticated') {
        return <Auth />
    }

    return (
        <div className="min-h-screen bg-gray-100 text-black">
            {/* Navigation Bar */}
            <nav className="bg-white p-4 shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <span className="text-lg font-semibold">Git Up!</span>
                    <div className="flex items-center">
                        <span className="mr-4">{data?.user?.name}</span>
                        <div className="mr-4">
                            <NovuProvider
                                subscriberId={data?.user?.email!}
                                applicationIdentifier={process?.env?.NEXT_PUBLIC_NOVU_APP_ID!}
                                initialFetchingStrategy={{
                                    fetchNotifications: true,
                                    fetchUserPreferences: true,
                                }}
                            >
                                <PopoverNotificationCenter colorScheme="light"
                                                           onNotificationClick={() => {}}
                                >
                                    {({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}
                                </PopoverNotificationCenter>
                            </NovuProvider>
                        </div>
                        <Menu as="div" className="relative inline-block text-left">
                            {({ open }) => (
                                <>
                                    <Menu.Button className="bg-blue-500 text-white px-3 py-2 rounded-full">
                                        Options
                                    </Menu.Button>
                                    <Menu.Items
                                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                                    >
                                        <div className="py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                <button
                                                    onClick={() => window.open('https://github.com/github-20k/trending-list')}
                                                    className={`${
                                                        active ? 'bg-blue-500 text-white' : 'text-gray-900'
                                                    } block px-4 py-2 text-sm w-full text-left`}
                                                >
                                                    GitHub
                                                </button>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => signOut()}
                                                        className={`${
                                                            active ? 'bg-blue-500 text-white' : 'text-gray-900'
                                                        } block px-4 py-2 text-sm w-full text-left`}
                                                    >
                                                        Logout
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </>
                            )}
                        </Menu>
                    </div>
                </div>
            </nav>
            <div className="container mx-auto mt-10 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full md:w-3/4 lg:w-1/2 mx-auto flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}