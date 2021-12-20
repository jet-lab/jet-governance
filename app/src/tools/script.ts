// nameOf operator
// https://schneidenbach.gitbooks.io/typescript-cookbook/content/nameof-operator.html
export function nameOf<T>(name: keyof T) {
  return name;
}

export function getNameOf<T>() {
  return (name: keyof T) => name;
}

export function getErrorMessage(ex: any) {
  if (ex instanceof Error) {
    return ex.message;
  }

  return JSON.stringify(ex);
}
