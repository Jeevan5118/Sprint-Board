export const getErrorMessage = (err, fallback = 'Something went wrong') => {
  if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
    return err.response.data.errors.map((e) => e.msg).join(', ');
  }
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.message) {
    return err.message;
  }
  return fallback;
};

