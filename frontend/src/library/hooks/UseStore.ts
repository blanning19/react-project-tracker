import { useEffect, useState } from "react";

export function useStore<T>(value: T): void
{
    const [, setTick] = useState(0);

    useEffect(() =>
    {
        setTick((previous) => previous + 1);
    }, [value]);
}

export default useStore;
