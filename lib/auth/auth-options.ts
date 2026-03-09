import type {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
} from "next"
import { getServerSession as localGetServerSession } from "next-auth/next"
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { accounts, users, sessions, verificationTokens } from "@/lib/db/schema";
import { db } from "@/lib/db/drizzle";
import type { SessionStrategy } from 'next-auth';
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { addInvitedUserToTeam, createTeam, updateUser } from "../db/queries";
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';

export const authOptions = (req?: Request) => ({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD
                }
            },
            from: process.env.EMAIL_FROM
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const [account] = await db
                    .select()
                    .from(accounts)
                    .where(
                        and(
                            eq(accounts.providerAccountId, credentials.email as string),
                            eq(accounts.provider, 'credentials')
                        )
                    )
                    .limit(1);

                if (!account || !account.access_token) {
                    return null;
                }

                const passwordHash = crypto.createHash('sha256').update(credentials.password as string).digest('hex');

                if (passwordHash !== account.access_token) {
                    return null;
                }

                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, account.userId))
                    .limit(1);

                if (!user) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            }
        }),
    ],
    session: {
        strategy: "jwt" as SessionStrategy,
    },
    callbacks: {
        async jwt({ token, account, user, trigger, session }: any) {
            if (account) {
                token.id = user?.id;
                token.role = user?.role;
                token.provider = account?.provider;
                token.type = account?.type;
            }
            if (trigger === "update" && session?.user) {
                token.name = session.user.name;
                token.email = session.user.email;
            }
            if (trigger === "signUp") {
                await handleSignup({ user, req });
            }
            return token
        },
        async session({ session, token }: { session: any, token: any }) {
            session.user.id = token?.id;
            session.user.role = token?.role;
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    }
})

export const getServerSession = async (...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) => {
    return await localGetServerSession(...args, authOptions());
};

const handleSignup = async ({ user, req }: { user: any, req?: Request }) => {
    if (!req) return;
    let inviteId, redirectUrl;
    try {
        const signinUrl = (new URL(req.url)).searchParams.get('callbackUrl');
        redirectUrl = (new URL(signinUrl || '')).searchParams.get('callbackUrl');
        inviteId = (new URL(redirectUrl || '')).searchParams.get('inviteId');
    } catch (error) {
        console.error("Error Signup redirectUrl: ", error)
    }
    if (inviteId) {
        await addInvitedUserToTeam({ inviteId: parseInt(inviteId), userId: user.id })
    } else {
        try {
            await updateUser(user.id, {
                role: 'owner'
            });
            await createTeam({
                teamName: user.name + " Team's",
                ownerId: user.id
            })
        } catch (error) {
            console.error("Error signup not invited: ", error)
        }
    }
}
