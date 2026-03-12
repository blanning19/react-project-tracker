class FormatUtils
{
    public static formatLongDate(value: Date): string
    {
        return value.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
}

export default FormatUtils;
