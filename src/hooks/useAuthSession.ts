import { useEffect } from "react";
import { authService } from "@/services/auth.service";
import { useSession } from "@/stores/session";

export function useAuthSession() {
  const setLoading = useSession((state) => state.setLoading);
  const setAuthenticated = useSession((state) => state.setAuthenticated);
  const setUnauthenticated = useSession((state) => state.setUnauthenticated);
  const setError = useSession((state) => state.setError);

  useEffect(() => {
    let active = true;
    setLoading();

    authService
      .restoreSession()
      .then((sessionUser) => {
        if (!active) return;
        if (sessionUser) setAuthenticated(sessionUser);
        else setUnauthenticated();
      })
      .catch((error) => {
        if (!active) return;
        setError(error instanceof Error ? error.message : "Unable to restore session.");
      });

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUnauthenticated();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setAuthenticated, setError, setLoading, setUnauthenticated]);
}
