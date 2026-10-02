const timestampOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const browserTimestampFormatter = new Intl.DateTimeFormat(undefined, timestampOptions);

export function formatLocalTimestamp(
  value: string,
  formatter = browserTimestampFormatter,
) {
  return formatter.format(new Date(value));
}
