export function readList(data, preferredKeys = []) {
  for (const key of preferredKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export function normalizeSemesterLabel(rawSemester) {
  if (rawSemester === undefined || rawSemester === null || rawSemester === '') {
    return '';
  }

  const value = String(rawSemester).toUpperCase();
  if (value.startsWith('SEM')) {
    return value.replace('SEM', '');
  }

  return value;
}
