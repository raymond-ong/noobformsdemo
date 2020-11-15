export const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

export const getMonthEndDate = (inDate) => {
  return new Date(inDate.getFullYear(), inDate.getMonth() + 1, 0);
}

export const getMonthStartDate = (inDate) => {
  return new Date(inDate.getFullYear(), inDate.getMonth(), 1);
}

export const isValidDate = (d) => {
  return d instanceof Date && !isNaN(d);
}

export const createMonthDate = (dateStr) => {
  let d = new Date(dateStr);
  if (!isValidDate(d)) {
    return null;
  }

  return new Date(d.getFullYear(), d.getMonth());
}

