//zod complain strong password
export function generateZodCompliantPassword(length = 10): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  const required = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specialChars[Math.floor(Math.random() * specialChars.length)],
  ];

  const allChars = lowercase + uppercase + numbers + specialChars;
  for (let i = required.length; i < length; i++) {
    required.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  return required.sort(() => Math.random() - 0.5).join("");
}


export function generateApplicationNo(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `APP-${year}-${randomDigits}`;
}

