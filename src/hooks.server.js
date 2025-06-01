import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

export async function handle({ event, resolve }) {

    const fetchedSession = await auth.api.getSession({
        headers: event.request.headers
    });

    if (fetchedSession) {
        const { user, session} = fetchedSession;
        event.locals.user = user;
        event.locals.session = session;
    }else{
        delete event.locals.user;
        delete event.locals.session;
    }
    return svelteKitHandler({ event, resolve, auth });
}