function App() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 text-neutral-950">
      <section className="max-w-xl text-center" aria-labelledby="admin-title">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-600">
          Cycle 0 foundation
        </p>
        <h1 id="admin-title" className="text-4xl font-semibold">
          Nuede Admin
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-700">
          The administration application is independently runnable. Authentication and workflows begin in later approved cycles.
        </p>
      </section>
    </main>
  );
}

export default App;
