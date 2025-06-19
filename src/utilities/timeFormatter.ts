const formatMinutesSeconds = (timeInMinutes: number) => {
  const minutes = Math.floor(timeInMinutes);
  const seconds = Math.round((timeInMinutes - minutes) * 60);

  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const readable =
    `${minutes} minute${minutes !== 1 ? "s" : ""}` +
    (seconds > 0 ? ` ${seconds} second${seconds !== 1 ? "s" : ""}` : "");

  const milliseconds = Math.round(timeInMinutes * 60 * 1000);

  return {
    formatted, // e.g. "1:30"
    readable, // e.g. "1 minute 30 seconds"
    minutes,
    seconds,
    milliseconds, // e.g. 90000
  };
};

export default formatMinutesSeconds;
