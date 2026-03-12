class DateUtils
{
    public static currentDateAtNoon(): Date
    {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        return now;
    }
}

export default DateUtils;
