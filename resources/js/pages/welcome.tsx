import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    Users,
    BarChart3,
    CircleDollarSign,
    Zap,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: ClipboardList,
            title: 'Task Management',
            description:
                'Create, organize, and prioritize tasks with due dates and status tracking.',
        },
        {
            icon: Users,
            title: 'Client Management',
            description:
                'Keep all your client information in one place and track relationships.',
        },
        {
            icon: BarChart3,
            title: 'Analytics Dashboard',
            description:
                'Get insights into your productivity with comprehensive charts and metrics.',
        },
        {
            icon: CircleDollarSign,
            title: 'Invoice Management',
            description:
                'Create and track invoices to stay on top of your billing and revenue.',
        },
    ];

    return (
        <>
            <Head title="Taskify - Task Management Made Simple">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-[#FDFDFC] to-white text-[#1b1b18] dark:from-[#0a0a0a] dark:to-[#1a1a18] dark:text-[#EDEDEC]">
                {/* Header/Navigation */}
                <header className="border-b border-[#e3e3e0]/30 dark:border-[#3E3E3A]/30">
                    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                        <div className="flex items-center gap-2">
                            <AppLogo />
                        </div>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex rounded-lg border border-[#19140035] bg-white px-6 py-2 text-sm font-medium leading-normal text-[#1b1b18] transition-all hover:border-[#1915014a] hover:shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="text-sm font-medium text-[#1b1b18] transition-colors hover:text-[#706f6c] dark:text-[#EDEDEC] dark:hover:text-[#A1A09A]"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex rounded-lg border border-[#19140035] bg-[#1b1b18] px-6 py-2 text-sm font-medium text-white transition-all hover:shadow-sm dark:border-[#3E3E3A] dark:bg-white dark:text-[#1b1b18]"
                                        >
                                            Sign up
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
                        <div className="flex flex-col justify-center">
                            <h1 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl">
                                Manage Your Tasks with
                                <span className="block bg-gradient-to-r from-[#1b1b18] to-[#706f6c] bg-clip-text text-transparent dark:from-[#EDEDEC] dark:to-[#A1A09A]">
                                    Taskify
                                </span>
                            </h1>
                            <p className="mb-8 text-lg text-[#706f6c] dark:text-[#A1A09A]">
                                A powerful task management platform designed to help you stay
                                organized, boost productivity, and collaborate seamlessly with
                                your team.
                            </p>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                {!auth.user && canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center justify-center rounded-lg bg-[#1b1b18] px-8 py-3 font-medium text-white transition-all hover:shadow-lg dark:bg-white dark:text-[#1b1b18]"
                                    >
                                        Get Started
                                        <Zap className="ml-2 h-4 w-4" />
                                    </Link>
                                )}
                                {!auth.user && (
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center justify-center rounded-lg border border-[#19140035] px-8 py-3 font-medium transition-all hover:border-[#1915014a] hover:bg-white/50 dark:border-[#3E3E3A] dark:hover:bg-white/5"
                                    >
                                        Sign In
                                    </Link>
                                )}
                                {auth.user && (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center justify-center rounded-lg bg-[#1b1b18] px-8 py-3 font-medium text-white transition-all hover:shadow-lg dark:bg-white dark:text-[#1b1b18]"
                                    >
                                        Go to Dashboard
                                        <Zap className="ml-2 h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="relative h-72 w-full rounded-lg border border-[#e3e3e0]/50 bg-gradient-to-br from-white to-[#f9f9f8] p-8 dark:border-[#3E3E3A]/50 dark:from-[#1a1a18] dark:to-[#161615]">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="rounded-lg bg-white/50 p-4 dark:bg-[#2a2a28]">
                                            <CheckCircle2 className="mx-auto h-8 w-8 text-[#1b1b18] dark:text-[#EDEDEC]" />
                                            <p className="mt-2 text-xs font-medium">Tasks</p>
                                        </div>
                                        <div className="rounded-lg bg-white/50 p-4 dark:bg-[#2a2a28]">
                                            <Users className="mx-auto h-8 w-8 text-[#1b1b18] dark:text-[#EDEDEC]" />
                                            <p className="mt-2 text-xs font-medium">Teams</p>
                                        </div>
                                        <div className="rounded-lg bg-white/50 p-4 dark:bg-[#2a2a28]">
                                            <BarChart3 className="mx-auto h-8 w-8 text-[#1b1b18] dark:text-[#EDEDEC]" />
                                            <p className="mt-2 text-xs font-medium">Analytics</p>
                                        </div>
                                        <div className="rounded-lg bg-white/50 p-4 dark:bg-[#2a2a28]">
                                            <CircleDollarSign className="mx-auto h-8 w-8 text-[#1b1b18] dark:text-[#EDEDEC]" />
                                            <p className="mt-2 text-xs font-medium">Invoices</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Features Section */}
                <section className="border-t border-[#e3e3e0]/30 bg-white/50 py-20 dark:border-[#3E3E3A]/30 dark:bg-[#1a1a18]">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
                                Powerful Features
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-[#706f6c] dark:text-[#A1A09A]">
                                Everything you need to manage tasks, collaborate with your
                                team, and track productivity.
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={feature.title}
                                        className="rounded-lg border border-[#e3e3e0]/50 bg-white p-6 transition-all hover:shadow-md dark:border-[#3E3E3A]/50 dark:bg-[#161615]"
                                    >
                                        <div className="mb-4 inline-block rounded-lg bg-[#f0f0ed] p-3 dark:bg-[#2a2a28]">
                                            <Icon className="h-6 w-6 text-[#1b1b18] dark:text-[#EDEDEC]" />
                                        </div>
                                        <h3 className="mb-2 font-semibold">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                            {feature.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="rounded-lg border border-[#e3e3e0]/50 bg-gradient-to-r from-[#1b1b18] to-[#706f6c] p-12 text-center dark:border-[#3E3E3A]/50 dark:from-[#161615] dark:to-[#2a2a28]">
                        <h2 className="mb-4 text-3xl font-bold text-white">
                            Ready to Get Started?
                        </h2>
                        <p className="mb-8 text-lg text-white/80">
                            Join thousands of users managing their tasks efficiently with
                            Taskify.
                        </p>
                        {!auth.user && canRegister && (
                            <Link
                                href={register()}
                                className="inline-flex items-center rounded-lg bg-white px-8 py-3 font-medium text-[#1b1b18] transition-all hover:shadow-lg"
                            >
                                Create Free Account
                                <Zap className="ml-2 h-4 w-4" />
                            </Link>
                        )}
                        {auth.user && (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center rounded-lg bg-white px-8 py-3 font-medium text-[#1b1b18] transition-all hover:shadow-lg"
                            >
                                Go to Dashboard
                                <Zap className="ml-2 h-4 w-4" />
                            </Link>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-[#e3e3e0]/30 dark:border-[#3E3E3A]/30">
                    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <AppLogo />
                            </div>
                            <p className="text-center text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                © 2026 Taskify. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
