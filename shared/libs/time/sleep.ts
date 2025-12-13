export const sleep = async (time: number) =>
  new Promise((resolve) =>
    setTimeout(() => {
      resolve(true);
    }, time),
  );
