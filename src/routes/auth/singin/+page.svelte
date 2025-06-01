<script>
  import { authClient } from "$lib/auth-client";
  const session = authClient.useSession();
</script>

<div>
  {#if $session.data}
    <div>
      <p>
        {$session?.data?.user.name}
      </p>
      <button
        onclick={async () => {
          await authClient.signOut();
        }}
      >
        Sign Out
      </button>
    </div>
  {:else}
    <button
      onclick={async () => {
        await authClient.signUp.email({
          email: "marc.egolf@outlook.com", // user email address
          password: "marc12345$", // user password -> min 8 characters by default
          name: "marc", // user display name
        });
      }}
    >
      Continue with GitHub
    </button>
  {/if}
</div>
