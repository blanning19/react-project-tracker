export function useStore<T>(_value: T): void
{
    // Deprecated: this hook previously forced an extra rerender.
    // Remove call sites where possible.
}

export default useStore;