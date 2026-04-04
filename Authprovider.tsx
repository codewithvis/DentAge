import { supabase } from "../services/supabase";
import { Session } from "@supabase/supabase-js";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

type AuthData = {
    session: Session | null;
    loading: boolean;
    refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthData>({
    session: null,
    loading: true,
    refreshSession: async () => {},
});

export default function AuthProvider({children}: PropsWithChildren) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshSession = async () => {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
                console.warn("Session refresh failed:", error.message);
                setSession(null);
            } else {
                setSession(data.session);
            }
        } catch (err) {
            console.warn("Error refreshing session:", err);
            setSession(null);
        }
    };

    useEffect(() => {
        const fetchSession = async() => {
            try {
                const {data, error} = await supabase.auth.getSession();
                if (error) {
                    console.warn("Session restoration failed:", error.message);
                    setSession(null);
                } else {
                    setSession(data.session);
                }
            } catch (err) {
                console.warn("Error fetching session:", err);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };
        
        fetchSession();
        
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };

    }, []);

    return <AuthContext.Provider value={{session, loading, refreshSession}}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);