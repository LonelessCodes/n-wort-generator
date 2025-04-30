/*
Durchrotieren:
5N: Nettles Neues Nicht Nachgemachtes Neetup
5N: Nettles <N-Word> Nicht <N-Word> Neetup
5N: Nettles Nacktes Nicht Nachgemachte Naturkatastrophe
*/

export const nwoerter = [
  "Neues",
  "Nussiges",
  "Neates",
  "Nominelles",
  "Norminiertes",
  "Norma",
  "Netto",
  "Neutrales",
  "Nichtorganisiertes",
  "Nahbares",
  "Nichtkommerzielles",
  "Norwegisches",
  "Norddeutsches",
  "Nachgemachtes",
  "Nacktes",
  "Niederträchtiges",
  "Nasales",
  "Nachbarschaftliches",
  "Naturnahes",
  "Niederschwelliges",
  "Notdürftiges",
  "Nihilistisches",
  "Nepotistisches",
  "Nekrophiles",
  "Nahrhaftes",
  "Nerviges",
  "Niwoloses",
  "Niwovolles",
  "Nobles",
  "Nobelpreislastiges",
  "Notariellbeglaubigtes",
  "Nymphomanisches",
  "Nierensteindurchsetztes",
  "Nonkoformistisches",
  "Nonverbales",
  "Neudeutsches",
  "Nachtaktives",
  "Neurotisches",
  "Nachrichtendienstlich Überwachtes",
  "Nervenzehrendes",
  "Narkotisierendes",
  "Nichtalkoholisches",
  "Neologistisches",
  "Nuttiges",
  "Neurologisches",
  "Namensloses",
  "Nippeliges",
  "Nerdiges",
  "Nein.",
  "Notfallmäßiges",
  "Narzistisches",
  "Nuschelndes",
  "NSA",
  "[NDA-RESTRICTED]",
  "Non-Public",
  "NSFW",
  "NASA",
  "Notstromunterstützes",
  "Nicht-Questcrusader-iges",
  "Nicht Unterstützt vom Bronies Bayern e.V.",
  "Naturgeschütztes",
  "Notbeendetes",
  "Notlichtbeleuchtes",
  "Notgeschlachtetes",
  "Noldenlichtiges",
  "Niedergebranntes",
  // Meine eigenen N-Wörter
  "Niedergeschlagenes",
  "Nachahmenswertes",
  "Nachhaltiges",
  "Nachtaktives",
  "Nervenaufreibendes",
  "Notgeiles",
  "Naives",
];

export function getSeed(): number {
  return Math.floor(Math.random() * nwoerter.length);
}

export function generateNWort(): string {
  const randomIndex = Math.floor(Math.random() * nwoerter.length);
  return nwoerter[randomIndex];
}

// Get n arrays of m random nwoerter where the first elements of the arrays are unique
export function generateNArraysOfMRandomNwoerter(n: number, m: number): string[][] {
  const result: string[][] = [];
  const usedIndices = new Set<number>();
  const nwoerterCopy = [...nwoerter];
  for (let i = 0; i < n; i++) {
    const array: string[] = [];
    for (let j = 0; j < m; j++) {
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * nwoerterCopy.length);
      } while (usedIndices.has(randomIndex));
      usedIndices.add(randomIndex);
      array.push(nwoerterCopy[randomIndex]);
    }
    result.push(array);
  }
  return result;
}

/*
Die Zylinder mit den N-Wörtern sollten nicht so groß sein, dass alle N-Wörter drauf passen (und dementsprechend der Umfang riesig ist).
Stattdessen nur ein Subset anzeigen. Der Zylinder wirkt runder, weil der Umfang kleiner und der Radius auch kleiner ist.

*/
