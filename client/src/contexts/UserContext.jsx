import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getProfile } from '../services/userService';

const UserContext = createContext(null);
const withAvatarVersion = (profile, previousUser) => ({
    ...profile,
    avatarVersion: profile.avatar !== previousUser?.avatar
        ? (profile.updatedAt || Date.now())
        : previousUser?.avatarVersion,
    coverVersion: profile.coverImage !== previousUser?.coverImage
        ? (profile.updatedAt || Date.now())
        : previousUser?.coverVersion,
});

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            if (!localStorage.getItem('token')) {
                localStorage.removeItem('user');
                return null;
            }
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            localStorage.removeItem('user');
            return null;
        }
    });
    const userRef = useRef(user);
    const [isUserLoading, setIsUserLoading] = useState(false);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const persistUser = useCallback((nextUser) => {
        setUser((previousUser) => {
            const resolvedUser = typeof nextUser === 'function' ? nextUser(previousUser) : nextUser;
            if (resolvedUser) {
                localStorage.setItem('user', JSON.stringify(resolvedUser));
            } else {
                localStorage.removeItem('user');
            }
            return resolvedUser;
        });
    }, []);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            persistUser(null);
            return null;
        }

        setIsUserLoading(true);
        try {
            const data = await getProfile();

            const nextUser = withAvatarVersion(data, userRef.current);
            persistUser(nextUser);
            return nextUser;
        } finally {
            setIsUserLoading(false);
        }
    }, [persistUser]);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            refreshUser().catch((error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    persistUser(null);
                }
            });
        }
    }, [persistUser, refreshUser]);

    const value = useMemo(() => ({ user, setUser: persistUser, refreshUser, isUserLoading }), [user, persistUser, refreshUser, isUserLoading]);
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used inside UserProvider');
    return context;
};
