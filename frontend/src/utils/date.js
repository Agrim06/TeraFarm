export function formatTimestampRaw(timestamp) {
  if (!timestamp) {
    return { time: '—', date: '—' };
  }

  let isoString;
  if (typeof timestamp === 'string') {
    isoString = timestamp;
  } else {
    isoString = new Date(timestamp).toISOString();
  }

  const [datePart, timePartWithZone] = isoString.split('T');
  if (!datePart || !timePartWithZone) {
    return { time: '—', date: '—' };
  }

  const [year, month, day] = datePart.split('-');
  const [hour = '00', minute = '00', secondPart = '00'] = timePartWithZone.replace('Z', '').split(':');
  const second = secondPart.slice(0, 2);

  return {
    time: `${hour}:${minute}:${second}`,
    date: `${day}-${month}-${year}`
  };
}

