<template>
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell; color:#111827">
    <header style="position:sticky;top:0;z-index:50;background:#111827;color:#fff;padding:10px 14px;display:flex;gap:12px;align-items:center">
      <strong style="margin-right:auto">Manipulator FE</strong>

      <nav style="display:flex;gap:10px;align-items:center">
        <RouterLink to="/login" style="color:#cbd5e1;text-decoration:none;cursor:pointer;display:inline-block;padding:6px 8px;border-radius:6px">Login</RouterLink>
        <RouterLink to="/admin/storages" style="color:#cbd5e1;text-decoration:none;cursor:pointer;display:inline-block;padding:6px 8px;border-radius:6px">Storages</RouterLink>
        <RouterLink to="/admin/routes" style="color:#cbd5e1;text-decoration:none;cursor:pointer;display:inline-block;padding:6px 8px;border-radius:6px">Routes</RouterLink>
        <RouterLink to="/admin/users" style="color:#cbd5e1;text-decoration:none;cursor:pointer;display:inline-block;padding:6px 8px;border-radius:6px;background:#374151">Users</RouterLink>
      </nav>

      <span style="opacity:.8">{{ time }}</span>
    </header>

    <main style="padding:16px">
      <RouterView />
      <pre id="fatal" style="color:#b91c1c; margin-top:16px;"></pre>
    </main>
  </div>
</template>
